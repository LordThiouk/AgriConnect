# Debug Visits - DELETE/UPDATE ne fonctionnent pas

## 🐛 Problème

Les opérations DELETE et UPDATE sur les visites échouent, probablement à cause du **RLS activé**.

---

## 🔍 Diagnostic - À faire dans le mobile

### Étape 1: Vérifier la session auth

Dans `mobile/app/(tabs)/agent-dashboard.tsx`, **ligne ~50** (début du composant), ajouter :

```typescript
useEffect(() => {
  const checkSession = async () => {
    const { data: { session }, error } = await CollecteService.supabase.auth.getSession();
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║       DEBUG SESSION AUTH                  ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('Session:', session ? '✅ ACTIVE' : '❌ INACTIVE');
    if (session) {
      console.log('  • user_id (auth.uid()):', session.user.id);
      console.log('  • email:', session.user.email);
      console.log('  • phone:', session.user.phone);
      console.log('  • expires_at:', session.expires_at);
    } else {
      console.error('❌ PAS DE SESSION AUTH !');
    }
    
    // Vérifier le profile lié
    if (session) {
      const { data: profile, error: profError } = await CollecteService.supabase
        .from('profiles')
        .select('id, user_id, role, phone')
        .eq('user_id', session.user.id)
        .single();
      
      console.log('\n📋 Profile lié:');
      if (profile) {
        console.log('  • profile_id:', profile.id);
        console.log('  • role:', profile.role);
        console.log('  • user_id match:', profile.user_id === session.user.id ? '✅' : '❌');
      } else {
        console.error('  ❌ AUCUN PROFILE TROUVÉ pour ce user_id !');
        console.error('  Erreur:', profError);
      }
    }
    console.log('═'.repeat(45));
  };
  checkSession();
}, []);
```

---

### Étape 2: Vérifier le mapping agent_id

Dans `confirmDeleteVisit` (ligne ~82), **AVANT** le DELETE, ajouter :

```typescript
const confirmDeleteVisit = async () => {
  if (!visitToDelete) return;
  
  try {
    setActionLoading(visitToDelete.id);
    
    // DEBUG: Vérifier les permissions
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║     DEBUG DELETE VISIT                    ║');
    console.log('╚═══════════════════════════════════════════╝');
    
    const { data: { session } } = await CollecteService.supabase.auth.getSession();
    console.log('1. Session active:', !!session);
    console.log('   auth.uid():', session?.user?.id);
    
    // Récupérer le profile
    const { data: profile } = await CollecteService.supabase
      .from('profiles')
      .select('id, user_id, role')
      .eq('user_id', session?.user?.id)
      .single();
    
    console.log('\n2. Profile agent:');
    console.log('   profile_id:', profile?.id);
    console.log('   role:', profile?.role);
    
    // Récupérer la visite à supprimer
    const { data: visit } = await CollecteService.supabase
      .from('visits')
      .select('id, agent_id, producer_id, status')
      .eq('id', visitToDelete.id)
      .single();
    
    console.log('\n3. Visite à supprimer:');
    console.log('   visit.id:', visit?.id);
    console.log('   visit.agent_id:', visit?.agent_id);
    console.log('   profile.id:', profile?.id);
    console.log('   MATCH:', visit?.agent_id === profile?.id ? '✅ OUI' : '❌ NON');
    
    if (visit?.agent_id !== profile?.id) {
      console.error('\n⚠️  PROBLÈME: L\'agent connecté n\'est PAS le propriétaire de la visite!');
      console.error('   RLS va BLOQUER la suppression.');
      Alert.alert('Erreur', 'Vous ne pouvez supprimer que vos propres visites.');
      return;
    }
    
    console.log('\n4. Tentative DELETE...');
    console.log('═'.repeat(45));
    
    // DELETE original
    const { error } = await CollecteService.supabase
      .from('visits')
      .delete()
      .eq('id', visitToDelete.id);

    if (error) {
      console.error('❌ DELETE échoué:', error);
      throw error;
    }

    console.log('✅ DELETE réussi');
    
    // ... reste du code
  } catch (error) {
    console.error('❌ Erreur suppression visite:', error);
    Alert.alert('Erreur', `Impossible de supprimer: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};
```

---

### Étape 3: Même chose pour UPDATE

Dans `handleMarkAsCompleted` (ligne ~119), ajouter le même debug :

```typescript
const handleMarkAsCompleted = async (visitId: string) => {
  try {
    setActionLoading(visitId);
    
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║     DEBUG UPDATE VISIT STATUS             ║');
    console.log('╚═══════════════════════════════════════════╝');
    
    const { data: { session } } = await CollecteService.supabase.auth.getSession();
    const { data: profile } = await CollecteService.supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', session?.user?.id)
      .single();
    
    const { data: visit } = await CollecteService.supabase
      .from('visits')
      .select('id, agent_id')
      .eq('id', visitId)
      .single();
    
    console.log('Profile ID:', profile?.id);
    console.log('Visit agent_id:', visit?.agent_id);
    console.log('Match:', visit?.agent_id === profile?.id ? '✅' : '❌');
    
    // UPDATE original...
    const { error } = await CollecteService.supabase
      .from('visits')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId);
    
    if (error) {
      console.error('❌ UPDATE échoué:', error);
      throw error;
    }
    
    console.log('✅ UPDATE réussi');
    console.log('═'.repeat(45));
    
    await refresh();
    Alert.alert('Succès', 'Visite marquée comme terminée');
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    Alert.alert('Erreur', `Impossible de mettre à jour: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};
```

---

## 🎯 Ce que vous devriez voir dans les logs

### ✅ Cas Normal (devrait fonctionner)

```
1. Session active: true
   auth.uid(): d6daff9e-c1af-4a96-ab51-bd8925813890

2. Profile agent:
   profile_id: cd1675c9-15f4-4cf1-b6d7-be01d37a9b6a
   role: agent

3. Visite:
   visit.agent_id: cd1675c9-15f4-4cf1-b6d7-be01d37a9b6a
   profile.id: cd1675c9-15f4-4cf1-b6d7-be01d37a9b6a
   MATCH: ✅ OUI

4. DELETE/UPDATE: ✅ RÉUSSI
```

### ❌ Cas Problématique

#### Problème 1: Pas de session
```
Session: ❌ INACTIVE
→ Solution: Reconnectez-vous
```

#### Problème 2 : Profile non trouvé
```
Session: ✅ ACTIVE
Profile: ❌ AUCUN PROFILE
→ Solution: Le user_id n'a pas de profile dans la table profiles
```

#### Problème 3: Agent_id ne match pas
```
visit.agent_id: aaaa-bbbb-cccc
profile.id:     xxxx-yyyy-zzzz
MATCH: ❌ NON
→ Solution: La visite appartient à un autre agent
```

---

## 🔧 Solutions Possibles

### Si pas de session
```typescript
// Forcer re-login
await supabase.auth.signOut();
router.replace('/(auth)/login');
```

### Si profile manquant
```sql
-- Vérifier dans Supabase Studio
SELECT * FROM profiles WHERE user_id = 'd6daff9e...';
-- Si vide, créer le profile manuellement
```

### Si agent_id incorrect
```sql
-- Les visites doivent avoir agent_id = profile.id de l'utilisateur connecté
-- Vérifier qui a créé ces visites
SELECT 
  v.id, 
  v.agent_id, 
  p.phone as agent_phone,
  v.status
FROM visits v
JOIN profiles p ON p.id = v.agent_id
WHERE v.id = 'visit-id-ici';
```

---

## ✅ Checklist

- [ ] Session auth active (auth.uid() présent)
- [ ] Profile existe et a `role = 'agent'`
- [ ] `profiles.user_id` = `auth.uid()`
- [ ] `visits.agent_id` = `profiles.id`
- [ ] RLS policy active et correcte

---

**Ajoutez ces logs et envoyez-moi le résultat de la console !** 📋

