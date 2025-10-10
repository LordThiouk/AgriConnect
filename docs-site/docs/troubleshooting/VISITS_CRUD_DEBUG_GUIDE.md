# Guide de Debug CRUD Visits - Mobile

## 🎯 Problème

Les opérations UPDATE et DELETE sur les visites échouent dans le mobile, probablement à cause du **RLS activé** qui nécessite une session auth valide.

---

## ✅ Tests Backend (Validés)

**Script**: `scripts/test-visits-crud-operations.js`

```
✅ SELECT fonctionne
✅ UPDATE fonctionne  
✅ DELETE fonctionne
✅ Mapping auth.uid() → visits.agent_id validé
```

**Conclusion Backend**: Toutes les opérations CRUD fonctionnent avec une authentification valide.

---

## 🔍 Diagnostic dans le Mobile

### Option 1: Diagnostic complet (recommandé)

Dans `agent-dashboard.tsx`, ajouter au début du composant :

```typescript
import { VisitsDiagnostic } from '@/lib/services/visitsDiagnostic';

// Au début du composant, après les hooks
useEffect(() => {
  VisitsDiagnostic.logSession();
}, []);

// Dans handleDeleteVisit ou handleMarkAsCompleted
const handleDeleteVisit = async (visit: any) => {
  // Diagnostic avant suppression
  await VisitsDiagnostic.diagnoseVisitPermissions(visit.id);
  
  // ... reste du code
};
```

### Option 2: Logs manuels simples

Dans `agent-dashboard.tsx`, fonction `confirmDeleteVisit` :

```typescript
const confirmDeleteVisit = async () => {
  if (!visitToDelete) return;
  
  try {
    setActionLoading(visitToDelete.id);
    
    // 🔍 DIAGNOSTIC
    const { data: { session } } = await CollecteService.supabase.auth.getSession();
    console.log('🔐 Session:', {
      active: !!session,
      user_id: session?.user?.id,
      phone: session?.user?.phone
    });
    
    if (!session) {
      Alert.alert('Erreur', 'Vous n\'êtes pas connecté. Reconnectez-vous.');
      return;
    }
    
    // Vérifier le profil
    const { data: profile } = await CollecteService.supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('👤 Profil:', {
      found: !!profile,
      profile_id: profile?.id,
      role: profile?.role
    });
    
    console.log('📍 Visite:', {
      id: visitToDelete.id,
      agent_id_expected: profile?.id,
      match: 'à vérifier en DB'
    });
    
    // DELETE
    console.log('🗑️ Tentative DELETE...');
    const { data, error } = await CollecteService.supabase
      .from('visits')
      .delete()
      .eq('id', visitToDelete.id)
      .select();
    
    if (error) {
      console.error('❌ DELETE échoue:', error);
      
      if (error.code === 'PGRST204') {
        Alert.alert('Erreur', 'Accès refusé. Vous ne pouvez supprimer que vos propres visites.');
      } else {
        Alert.alert('Erreur', `Impossible de supprimer: ${error.message}`);
      }
      return;
    }
    
    console.log('✅ DELETE réussi:', data);
    
    // ... suite du code (fermer modal, refresh, etc.)
```

---

## 🧪 Test Rapide Mobile

1. Ouvrir le dashboard agent
2. Essayer de supprimer/modifier une visite
3. Regarder les logs dans la console
4. Copier/coller les logs ici

---

## ⚠️ Causes Probables

| Erreur | Code | Cause | Solution |
|--------|------|-------|----------|
| No session | - | Utilisateur non connecté | Se reconnecter |
| PGRST204 | RLS | `visit.agent_id ≠ profile.id` | Vérifier les assignations |
| PGRST116 | 0 rows | Visite inexistante ou filtrée | Vérifier l'ID |
| 42501 | Privilege | Problème RLS policy | Vérifier migration 122000 |

---

## 🔧 Fix Rapides

### Si la session est perdue

```typescript
// Dans AuthContext ou au démarrage de l'app
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Rediriger vers login
      router.replace('/(auth)/login');
    }
  };
  checkSession();
}, []);
```

### Si l'agent_id ne match pas

Vérifier que la visite appartient bien à l'agent :

```sql
-- Dans Supabase Studio ou pgAdmin
SELECT 
  v.id,
  v.agent_id,
  p.user_id,
  p.role,
  p.display_name
FROM visits v
JOIN profiles p ON p.id = v.agent_id
WHERE v.id = 'VISIT_ID_ICI';
```

---

## 📝 Checklist de Validation

- [ ] Session auth active (`supabase.auth.getSession()`)
- [ ] `session.user.id` présent
- [ ] Profil agent trouvé (`profiles.user_id = session.user.id`)
- [ ] `profiles.role = 'agent'`
- [ ] Visite accessible (`.select()` retourne des données)
- [ ] `visit.agent_id = profile.id`
- [ ] UPDATE fonctionne (pas d'erreur PGRST)
- [ ] DELETE fonctionne (pas d'erreur PGRST)

---

**Date**: 1er octobre 2025  
**Script de test**: `scripts/test-visits-crud-operations.js` ✅  
**Service diagnostic**: `mobile/lib/services/visitsDiagnostic.ts` ✅

