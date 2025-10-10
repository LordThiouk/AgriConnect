# Guide d'Utilisation : Service de Diagnostic Visits

## 🎯 Objectif

Le service `VisitsDiagnostic` vous aide à debugger les problèmes d'authentification et de permissions RLS pour les opérations CRUD sur les visites.

---

## 📦 Import

```typescript
import { VisitsDiagnostic } from '@/lib/services/visitsDiagnostic';
```

---

## 🚀 Utilisation

### 1️⃣ Log Rapide de la Session (Recommandé au Démarrage)

**Dans** : `mobile/app/(tabs)/agent-dashboard.tsx (existe toujours)`

**Ajouter après les imports** (ligne 14) :

```typescript
import { VisitsDiagnostic } from '../../lib/services/visitsDiagnostic';
```

**Ajouter dans le composant** (après le hook `useAgentDashboard`, ligne ~35) :

```typescript
// 🔍 LOG SESSION AU DÉMARRAGE (DEBUG)
React.useEffect(() => {
  VisitsDiagnostic.logSession();
}, []);
```

**Résultat dans la console** :
```
🔐 Session: {
  user_id: 'b00a283f-0a46-41d2-af95-8a256c9c2771',
  email: null,
  phone: '221770951543',
  expires_in: '167 min'
}
```

---

### 2️⃣ Diagnostic Complet Avant UPDATE/DELETE

**Dans** : `mobile/app/(tabs)/agent-dashboard.tsx (existe toujours)`

**Dans la fonction `confirmDeleteVisit`** (ligne ~82) :

```typescript
const confirmDeleteVisit = async () => {
  if (!visitToDelete) return;
  
  try {
    setActionLoading(visitToDelete.id);
    
    // 🔍 DIAGNOSTIC COMPLET
    console.log('\n═══════════ DIAGNOSTIC DELETE VISITE ═══════════');
    await VisitsDiagnostic.diagnoseVisitPermissions(visitToDelete.id);
    console.log('═══════════════════════════════════════════════\n');
    
    // Continuer avec DELETE
    console.log('🗑️ Suppression en cours...');
    
    const { error } = await CollecteService.supabase
      .from('visits')
      .delete()
      .eq('id', visitToDelete.id);
    
    if (error) {
      console.error('❌ Erreur Supabase suppression:', error);
      throw error;
    }
    
    console.log('✅ Visite supprimée avec succès');
    
    // Fermer le modal et rafraîchir
    setDeleteModalVisible(false);
    setVisitToDelete(null);
    await refresh();
    Alert.alert('Succès', 'Visite supprimée avec succès');
  } catch (error: any) {
    console.error('❌ Erreur suppression visite:', error);
    Alert.alert('Erreur', `Impossible de supprimer la visite: ${error.message || 'Erreur inconnue'}`);
  } finally {
    setActionLoading(null);
  }
};
```

**Dans la fonction `handleMarkAsCompleted`** (ligne ~119) :

```typescript
const handleMarkAsCompleted = async (visitId: string) => {
  try {
    setActionLoading(visitId);
    
    // 🔍 DIAGNOSTIC COMPLET
    console.log('\n═══════════ DIAGNOSTIC UPDATE VISITE ═══════════');
    await VisitsDiagnostic.diagnoseVisitPermissions(visitId);
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('✅ Tentative de marquage visite comme terminée:', visitId);
    
    const { error } = await CollecteService.supabase
      .from('visits')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId);
    
    if (error) {
      console.error('❌ Erreur Supabase mise à jour:', error);
      throw error;
    }
    
    console.log('✅ Visite marquée comme terminée');
    await refresh();
    Alert.alert('Succès', 'Visite marquée comme terminée');
  } catch (error: any) {
    console.error('❌ Erreur marquage visite:', error);
    Alert.alert('Erreur', `Impossible de mettre à jour: ${error.message || 'Erreur inconnue'}`);
  } finally {
    setActionLoading(null);
  }
};
```

---

## 📊 Résultats du Diagnostic

### ✅ Cas Normal (Tout OK)

```
🔍 ════ DIAGNOSTIC PERMISSIONS VISITS ════

1️⃣ Session Auth:
   ✅ Session active
      user_id (auth.uid): b00a283f-0a46-41d2-af95-8a256c9c2771
      phone: 221770951543
      expires_at: 01/10/2025 15:30:00

2️⃣ Profil Utilisateur:
   ✅ Profil trouvé
      profile_id: 0f33842a-a1f1-4ad5-8113-39285e5013df
      role: agent
      Match user_id: ✅

3️⃣ Visite:
   ✅ Visite accessible
      visit_id: 122cc6de-c1bb-4d67-9522-a994e4574462
      agent_id: 0f33842a-a1f1-4ad5-8113-39285e5013df
      status: completed
      Match agent_id: ✅

4️⃣ Test UPDATE:
   ✅ UPDATE fonctionne !

5️⃣ Test DELETE:
   ✅ DELETE autorisé

════════════════════════════════════

📊 RÉSUMÉ:

Session active:        ✅
Profil trouvé:         ✅
Visite accessible:     ✅
Match user_id:         ✅
Match agent_id:        ✅

🎉 TOUT EST OK ! UPDATE/DELETE devraient fonctionner.
```

---

### ❌ Problème : Pas de Session

```
1️⃣ Session Auth:
   ❌ PAS DE SESSION AUTH !
   → L'utilisateur doit se reconnecter
```

**Solution** : Rediriger vers login ou relancer `supabase.auth.signInWithOtp()`.

---

### ❌ Problème : Visite Inaccessible

```
3️⃣ Visite:
   ❌ VISITE NON TROUVÉE (bloquée par RLS ou inexistante)
   → Vérifier que visit.agent_id correspond à profile.id
```

**Cause** : L'agent essaie de modifier une visite d'un autre agent.

**Solution** : Vérifier en DB avec ce query :
```sql
SELECT 
  v.id,
  v.agent_id,
  p.user_id,
  p.role
FROM visits v
JOIN profiles p ON p.id = v.agent_id
WHERE v.id = 'VISIT_ID_ICI';
```

---

## 🧹 Nettoyage (Après Debug)

Une fois que tout fonctionne, **retirer** les appels `diagnoseVisitPermissions()` pour ne garder que `logSession()` au démarrage.

```typescript
// GARDER (utile)
React.useEffect(() => {
  VisitsDiagnostic.logSession();
}, []);

// RETIRER (après debug)
// await VisitsDiagnostic.diagnoseVisitPermissions(visitId);
```

---

## 📝 Checklist

- [ ] Import `VisitsDiagnostic` dans `agent-dashboard.tsx`
- [ ] Ajouter `logSession()` dans un `useEffect`
- [ ] Tester une suppression de visite
- [ ] Lire les logs de la console
- [ ] Copier/coller les logs si problème
- [ ] Retirer le diagnostic après validation

---

**C'est prêt !** Ajoutez ces 2 lignes dans votre code mobile et testez ! 🚀

