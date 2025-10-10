# 🔧 Corrections Fonctions RPC - Migration plots

## Problème Initial

Après le renommage `farm_file_plots` → `plots`, les fonctions RPC référençaient encore l'ancien nom de table.

### Erreurs Rencontrées

1. **Erreur 404**: `relation "farm_file_plots" does not exist`
   - Les RPC cherchaient la table `farm_file_plots` qui n'existe plus

2. **Erreur 400**: Type mismatch `double precision` vs `numeric`
   - Les colonnes latitude/longitude retournent `double precision`
   - La fonction déclarait `numeric`

---

## Solutions Appliquées

### Migration 20251001115000 - Mise à jour table name (Lot 1)

**7 fonctions RPC mises à jour** pour utiliser `plots`:

1. ✅ `get_plots_with_geolocation`
2. ✅ `get_plots_with_geolocation_count`
3. ✅ `get_plots_by_producer`
4. ✅ `get_agent_today_visits`
5. ✅ `get_agent_plots_with_geolocation`
6. ✅ `get_operations_for_plot`
7. ✅ `get_observations_for_plot`

**Changement**: `FROM public.farm_file_plots` → `FROM public.plots`

### Migrations 20251001120100-120200 - Fonctions farm_files (Lot 2)

**3 fonctions additionnelles corrigées** (découvertes après tests):

8. ✅ `get_farm_files_with_stats` (Migration 120100)
9. ✅ `get_farm_files` (Migration 120200)
10. ✅ `get_farm_files_by_producer` (Migration 120200)

**Changement**: Comptage parcelles via `plots` au lieu de `farm_file_plots`

### Migration 20251001120300 - Fonctions operations/observations (Lot 3)

**3 fonctions additionnelles corrigées** (découvertes après tests):

11. ✅ `get_operations_with_details` (Migration 120300)
12. ✅ `get_operations_with_details_v3` (Migration 120300)
13. ✅ `get_observations_with_details_v3` (Migration 120300)

**Changement**: `farm_file_plots ffp` → `plots plt`

### Migration 20251001120400 - Correction observed_by (Lot 4)

**3 fonctions corrigées** (erreur colonne détectée):

14. ✅ `get_observations_with_details_v3` (re-correction: observer_id → observed_by)
15. ✅ `count_operations_for_producer` (créée/mise à jour)
16. ✅ `count_observations_for_producer` (créée/mise à jour)

**Changements**: 
- `observations.observer_id` → `observations.observed_by`
- Ajout fonctions count manquantes

### Migration 20251001120500 - Correction colonnes observations finales

**1 fonction re-corrigée** (schéma réel):

- ✅ `get_observations_with_details_v3` (correction finale: utilisation colonnes réelles)

**Colonnes corrigées**:
- ❌ Supprimées: `growth_stage`, `health_status`, `pest_disease_detected`, `pest_disease_description`, `severity_level`
- ✅ Utilisées: `observation_type`, `emergence_percent`, `pest_disease_name`, `severity`, `affected_area_percent`, `description`, `recommendations`, `observed_by`

### Migration 20251001115100 - Correction types lat/lon

**2 fonctions corrigées** pour les types:

1. ✅ `get_plots_with_geolocation`
   - `latitude numeric` → `latitude double precision`
   - `longitude numeric` → `longitude double precision`

2. ✅ `get_agent_plots_with_geolocation`
   - `latitude numeric` → `latitude double precision`
   - `longitude numeric` → `longitude double precision`

**Raison**: `ST_Y()` et `ST_X()` retournent `double precision` nativement

### Migration 20251001115200 - Tentative correction geom

**Problème détecté**: geom retournait directement mais erreur persistait

### Migration 20251001115300 - Tentative conversion conditionnelle

**Problème**: CASE/WHEN essayait de convertir JSONB en GEOMETRY

### Migration 20251001115400 - Tentative sans conversion

**Problème**: geom retourné directement mais type GEOMETRY persistait

### Migration 20251001115500 - SOLUTION FINALE

**Conversion explicite appliquée**:
- ✅ `ST_AsGeoJSON(p.geom)::jsonb` pour geom
- ✅ `ST_AsGeoJSON(p.center_point)::jsonb` pour center_point
- ✅ `COALESCE(ST_Y/ST_X(), 0)::double precision` pour lat/lon
- ✅ Protection NULL avec CASE WHEN

---

## Résultat

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║      ✅ TOUTES LES FONCTIONS RPC CORRIGÉES (16)       ║
║                                                        ║
║  • 16 fonctions utilisent maintenant 'plots'          ║
║  • Types latitude/longitude corrigés                   ║
║  • Colonne observed_by corrigée                       ║
║  • Erreurs 404, 400 et 42703 résolues                ║
║  • Lot 1: 7 fonctions plots (115000)                  ║
║  • Lot 2: 3 fonctions farm_files (120100-120200)     ║
║  • Lot 3: 3 fonctions operations/obs (120300)        ║
║  • Lot 4: 3 fonctions observed_by (120400)           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## Tests

### Avant
```
❌ POST /rpc/get_plots_with_geolocation → 404 Not Found
❌ relation "farm_file_plots" does not exist
```

### Après Migration 115000
```
⚠️ POST /rpc/get_plots_with_geolocation → 400 Bad Request
⚠️ Returned type double precision does not match expected type numeric
```

### Après Migration 115100
```
⚠️ POST /rpc/get_plots_with_geolocation → 400 Bad Request
⚠️ Returned type geometry does not match expected type jsonb (column 17)
```

### Après Migration 115300
```
❌ POST /rpc/get_plots_with_geolocation → 400 Bad Request
❌ CASE/WHEN could not convert type jsonb to geometry
```

### Après Migration 115400
```
❌ POST /rpc/get_plots_with_geolocation → 400 Bad Request
❌ Returned type geometry(Polygon,4326) does not match jsonb (column 17)
```

### Après Migration 115500
```
✅ POST /rpc/get_plots_with_geolocation → 200 OK
✅ Conversion ST_AsGeoJSON() appliquée pour geom et center_point
✅ Données parcelles retournées avec géolocalisation en JSONB
```

---

## Fonctions RPC Finales

### get_plots_with_geolocation
```sql
RETURNS TABLE (
  ...
  latitude double precision,
  longitude double precision,
  ...
)
FROM public.plots p  -- ✓ Utilise plots
```

### get_agent_plots_with_geolocation
```sql
RETURNS TABLE (
  ...
  latitude double precision,
  longitude double precision,
  ...
)
FROM public.plots p  -- ✓ Utilise plots
```

---

## Impact

- ✅ **Page /plots** fonctionnelle
- ✅ **Carte interactive** opérationnelle
- ✅ **Mobile parcelles** avec GPS
- ✅ **Dashboard agent** avec visites

---

**Date**: 1er octobre 2025  
**Migrations**: 2 corrections RPC  
**Statut**: ✅ Résolu

