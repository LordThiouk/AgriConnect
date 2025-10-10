# Fix UPDATE/DELETE Visites - Guide Complet

## 🎯 Problème

Les opérations UPDATE et DELETE sur les visites ne fonctionnaient pas correctement car **RLS n'était pas activé** sur la table `visits`.

---

## ✅ Solution Appliquée

### Migration 20251001122000

**Actions**:
1. ✅ Activé RLS sur la table `visits`
2. ✅ Recréé 10 politiques RLS correctes
3. ✅ Bloqué l'accès anonyme (non authentifié)

**Politiques créées**:

| Rôle | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **Agent** | ✅ Ses visites | ✅ Ses visites | ✅ Ses visites | ✅ Ses visites |
| **Superviseur/Admin** | ✅ Toutes | ✅ Toutes | ✅ Toutes | ✅ Toutes |
| **Anonyme** | ❌ Aucun accès | ❌ Aucun accès | ❌ Aucun accès | ❌ Aucun accès |

---

## 🔍 Mapping des Permissions

```
auth.uid() (JWT token)
    ↓
profiles.user_id
    ↓
profiles.id
    ↓
visits.agent_id
```

**Règle** : Un agent peut modifier/supprimer une visite **SI ET SEULEMENT SI** :
- Il est authentifié (session active)
- Son `auth.uid()` correspond à un `profiles.user_id`
- Ce `profiles.id` correspond au `visits.agent_id`

---

## 🧪 Tests à Effectuer dans le Mobile

### 1. Vérifier la session auth

Ajouter temporairement dans `agent-dashboard.tsx` (ligne ~50) :

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session }, error } = await CollecteService.supabase.auth.getSession();
    console.log('🔐 Session auth:', {
      user_id: session?.user?.id,
      email: session?.user?.email,
      phone: session?.user?.phone,
      expires_at: session?.expires_at
    });
    
    if (!session) {
      console.error('❌ PAS DE SESSION AUTH !');
      Alert.alert('Erreur', 'Vous n\'êtes pas connecté. Reconnectez-vous.');
    }
  };
  checkAuth();
}, []);
```

**Résultat attendu** :
- ✅ `user_id` présent (UUID)
- ✅ `phone` ou `email` présent
- ✅ `expires_at` dans le futur

### 2. Tester UPDATE visite

Dans `agent-dashboard.tsx`, fonction `handleMarkAsCompleted` (ligne ~119) :

```typescript
const handleMarkAsCompleted = async (visitId: string) => {
  try {
    setActionLoading(visitId);
    
    // 1. Vérifier session
    const { data: { session } } = await CollecteService.supabase.auth.getSession();
    console.log('🔐 Session active:', !!session);
    
    // 2. Tenter UPDATE
    console.log('🔄 UPDATE visite:', visitId);
    const { data, error } = await CollecteService.supabase
      .from('visits')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId)
      .select(); // IMPORTANT: Ajouter .select() pour voir le résultat
    
    if (error) {
      console.error('❌ Erreur UPDATE:', error);
      throw error;
    }
    
    console.log('✅ UPDATE réussi:', data);
    
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

### 3. Tester DELETE visite

Dans `agent-dashboard.tsx`, fonction `confirmDeleteVisit` (ligne ~82) :

```typescript
const confirmDeleteVisit = async () => {
  if (!visitToDelete) return;
  
  try {
    setActionLoading(visitToDelete.id);
    
    // 1. Vérifier session
    const { data: { session } } = await CollecteService.supabase.auth.getSession();
    console.log('🔐 Session active:', !!session);
    
    // 2. Tenter DELETE
    console.log('🗑️ DELETE visite:', visitToDelete.id);
    const { data, error } = await CollecteService.supabase
      .from('visits')
      .delete()
      .eq('id', visitToDelete.id)
      .select(); // IMPORTANT: Voir ce qui a été supprimé
    
    if (error) {
      console.error('❌ Erreur DELETE:', error);
      throw error;
    }
    
    console.log('✅ DELETE réussi:', data);
    
    setDeleteModalVisible(false);
    setVisitToDelete(null);
    await refresh();
    Alert.alert('Succès', 'Visite supprimée');
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    Alert.alert('Erreur', `Impossible de supprimer: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};
```

---

## 🚨 Codes d'Erreur Possibles

### `PGRST116` - Row not found
**Cause**: Aucune ligne trouvée avec l'ID donné
**Solution**: Normal si l'ID est incorrect

### `PGRST204` - No rows returned
**Cause**: La politique RLS a filtré toutes les lignes
**Solutions**:
1. Vérifier que l'agent est authentifié
2. Vérifier que `auth.uid()` → `profiles.user_id` existe
3. Vérifier que `profiles.id` → `visits.agent_id` correspond

### `42501` - Insufficient privilege
**Cause**: RLS refuse l'accès
**Solutions**:
1. L'utilisateur n'a pas le rôle 'agent', 'supervisor' ou 'admin'
2. L'agent essaie de modifier la visite d'un autre agent

---

## 📝 Diagnostic Complet

Si UPDATE/DELETE échouent, exécuter ce diagnostic dans le mobile :

```typescript
const diagn

oseVisitPermissions = async (visitId: string) => {
  console.log('\n🔍 DIAGNOSTIC COMPLET\n');
  
  // 1. Session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('1. Session:', session ? '✅' : '❌');
  console.log('   user_id:', session?.user?.id);
  
  // 2. Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id, role')
    .eq('user_id', session?.user?.id)
    .single();
  console.log('2. Profile:', profile ? '✅' : '❌');
  console.log('   profile_id:', profile?.id);
  console.log('   role:', profile?.role);
  
  // 3. Visite
  const { data: visit } = await supabase
    .from('visits')
    .select('id, agent_id, status')
    .eq('id', visitId)
    .single();
  console.log('3. Visite:', visit ? '✅' : '❌');
  console.log('   visit.agent_id:', visit?.agent_id);
  console.log('   profile.id:', profile?.id);
  console.log('   Match:', visit?.agent_id === profile?.id ? '✅' : '❌');
  
  // 4. Test UPDATE
  const { error: updateError } = await supabase
    .from('visits')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', visitId);
  console.log('4. UPDATE:', updateError ? '❌' : '✅');
  if (updateError) console.log('   Erreur:', updateError);
  
  console.log('\n═══════════════════════════════\n');
};
```

---

## ✅ Checklist de Validation

- [ ] RLS activé sur `visits` (✅ fait via migration)
- [ ] 10 politiques créées (✅ fait via migration)
- [ ] Session auth active dans le mobile
- [ ] `auth.uid()` correspond à `profiles.user_id`
- [ ] `profiles.id` correspond à `visits.agent_id`
- [ ] UPDATE fonctionne pour les visites de l'agent
- [ ] DELETE fonctionne pour les visites de l'agent
- [ ] UPDATE/DELETE échouent pour les visites d'autres agents

---

## 🎯 Prochaines Étapes

1. **Tester dans le mobile** avec les logs ajoutés
2. **Vérifier les erreurs** dans la console
3. **Si échec** : exécuter le diagnostic complet
4. **Rapporter** : Copier les logs de la console

---

**Date**: 1er octobre 2025  
**Migration**: `20251001122000_fix_visits_rls_enable.sql`  
**Statut**: ✅ RLS ACTIVÉ - Tests mobile requis

