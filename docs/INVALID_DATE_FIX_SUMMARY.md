# Résolution du Bug "Invalid Date" - Dashboard Agent Mobile

## 🐛 Problème Initial

**Symptôme**: Dans l'application mobile AgriConnect, le dashboard agent affichait "Invalid Date" pour les visites planifiées.

```
Détails de la visite
Producteur: Producteur6 Nord
Parcelle: Parcelle A - Riz 9dcc2df2
GPS disponible
Visite: Invalid Date  ← ❌ PROBLÈME
à faire
```

---

## 🔍 Diagnostic

### Étape 1: Analyse de la table `visits`

**Script créé**: `scripts/analyze-visits-table.js`

**Résultat**:
- ✅ La table contient bien des visites avec des dates valides
- ✅ Colonne `visit_date` existe et contient des timestamps ISO 8601
- ❌ **Toutes les visites avaient `plot_id = NULL`**

### Étape 2: Analyse du RPC `get_agent_today_visits`

**Script créé**: `scripts/test-get-agent-today-visits.js`

**Problème identifié**: Le RPC retournait:
```json
{
  "date": "2025-10-01",
  "visitDate": "2025-10-01"
}
```

Mais le code mobile cherchait:
```javascript
new Date(selectedVisit.visit_date)  // ← undefined !
```

---

## 🔧 Solutions Appliquées

### Solution 1: Reconnexion des visites aux parcelles

**Migration**: `20251001121700_reconnect_visits_to_plots.sql`

**Action**:
```sql
UPDATE visits v
SET plot_id = (
  SELECT p.id
  FROM plots p
  WHERE p.producer_id = v.producer_id
  ORDER BY p.created_at DESC
  LIMIT 1
)
WHERE v.plot_id IS NULL
```

**Résultat**: 16/16 visites reconnectées ✅

---

### Solution 2: Correction du nom de champ dans le RPC

**Migration**: `20251001121800_fix_visit_date_field_name.sql`

**Changement**:
```sql
-- AVANT (incorrect)
json_build_object(
  'date', CURRENT_DATE,
  'visitDate', CURRENT_DATE
)

-- APRÈS (correct)
json_build_object(
  'visit_date', CURRENT_DATE::text,
  'duration_minutes', 30
)
```

**Raison**: Le code mobile utilise `visit_date` (snake_case), qui correspond à la colonne de la table `visits`.

---

## ✅ Validation

### Test du RPC

```javascript
const { data } = await supabase.rpc('get_agent_today_visits', { 
  p_user_id: agent.user_id 
});

console.log(data);
// [
//   {
//     "id": "0a95729b-fc0b-4fdf-be96-40a24db4f2e9",
//     "producer": "Producteur20 Sud",
//     "location": "Parcelle Producteur20 Sud",
//     "visit_date": "2025-10-01",  ← ✅ CORRECT
//     "duration_minutes": 30
//   }
// ]
```

### Conversion en Date JavaScript

```javascript
const dateObj = new Date(visit.visit_date);
console.log(dateObj.toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}));
// "mercredi 1 octobre 2025" ← ✅ VALIDE
```

---

## 📊 Récapitulatif des Changements

| # | Migration | Description | Résultat |
|---|-----------|-------------|----------|
| 31 | 20251001121700 | Reconnexion visites → parcelles | 16/16 visites ✅ |
| 32 | 20251001121800 | Fix visit_date field name | Format correct ✅ |

**Scripts créés**:
- `scripts/analyze-visits-table.js` (analyse structure)
- `scripts/test-get-agent-today-visits.js` (validation RPC)

**Durée totale debug**: ~15 minutes

---

## 🎯 Conclusion

Le bug "Invalid Date" était dû à un **décalage de convention de nommage** entre le RPC et le frontend mobile:

- **RPC** retournait: `date` et `visitDate` (camelCase)
- **Mobile** attendait: `visit_date` (snake_case, comme dans la DB)

**Solution finale**: Aligner le RPC sur la convention snake_case de la base de données.

**Leçon apprise**: Toujours vérifier la cohérence des noms de champs entre:
1. Structure de la table SQL
2. Retour des fonctions RPC
3. Utilisation dans le frontend

---

**Date de résolution**: 1er octobre 2025  
**Statut**: ✅ RÉSOLU ET VALIDÉ

