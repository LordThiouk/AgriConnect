# 🔍 Parcours de Debug: Erreur Type GEOM

## Problème Initial
```
❌ Error: Returned type geometry(Polygon,4326) does not match expected type jsonb in column 17
```

## 🎯 Objectif
Retourner la colonne `geom` en tant que `jsonb` dans la fonction RPC `get_plots_with_geolocation`

---

## 📊 5 Tentatives de Résolution

### Tentative 1 (Migration 115200)
**Approche**: Retourner `p.geom` directement
```sql
p.geom  -- Pensait que c'était déjà en JSONB
```
**Résultat**: ❌ Échec - Erreur persistante

---

### Tentative 2 (Migration 115300)
**Approche**: Conversion conditionnelle avec détection de type
```sql
CASE 
  WHEN pg_typeof(p.geom)::text LIKE '%geometry%' 
  THEN ST_AsGeoJSON(p.geom::geometry)::jsonb
  ELSE p.geom
END
```
**Résultat**: ❌ Échec - `CASE/WHEN could not convert type jsonb to geometry`

**Analyse**: Le CASE essayait de traiter JSONB comme GEOMETRY

---

### Tentative 3 (Migration 115400)
**Approche**: Retour direct sans aucune conversion
```sql
p.geom  -- Simplifié après analyse script
```
**Résultat**: ❌ Échec - Même erreur geometry vs jsonb

---

### Tentative 4 (Script d'analyse)
**Outil**: `scripts/analyze-plots-table-structure.js`
```javascript
// Analyse de la structure réelle
const { data } = await supabase
  .from('plots')
  .select('geom, center_point')
  .limit(1);
```
**Conclusion**: Le script suggérait que geom était en JSONB (erreur d'interprétation)

---

### ✅ Tentative 5 (Migration 115500) - SOLUTION FINALE

**Approche**: Conversion explicite ST_AsGeoJSON()
```sql
CASE 
  WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(p.geom)::jsonb
  ELSE NULL
END AS geom
```

**Pourquoi ça fonctionne**:
1. ✅ `ST_AsGeoJSON()` convertit GEOMETRY → string GeoJSON
2. ✅ `::jsonb` cast la string en JSONB PostgreSQL
3. ✅ Protection NULL avec CASE WHEN
4. ✅ Même logique appliquée à `center_point`

**Résultat**: ✅ Succès - Type jsonb conforme

---

## 📚 Leçons Apprises

### 1. Vérification de type en PostgreSQL
```sql
-- ❌ Mauvaise approche (script client)
SELECT geom FROM plots LIMIT 1;

-- ✅ Bonne approche (vérifier le schéma)
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'plots' AND column_name = 'geom';
```

### 2. Conversion GEOMETRY → JSONB
```sql
-- Méthode standard PostGIS
ST_AsGeoJSON(geometry_column)::jsonb
```

### 3. Protection NULL
```sql
-- Toujours protéger les conversions
CASE 
  WHEN column IS NOT NULL THEN ST_AsGeoJSON(column)::jsonb
  ELSE NULL
END
```

---

## 🎯 Résultat Final

**2 fonctions RPC corrigées**:
1. ✅ `get_plots_with_geolocation`
2. ✅ `get_agent_plots_with_geolocation`

**Conversions appliquées**:
- `geom`: `ST_AsGeoJSON(p.geom)::jsonb`
- `center_point`: `ST_AsGeoJSON(p.center_point)::jsonb`
- `latitude`: `COALESCE(ST_Y(p.center_point), 0)::double precision`
- `longitude`: `COALESCE(ST_X(p.center_point), 0)::double precision`

---

## ⏱️ Temps de Résolution

- **Détection**: 1 minute
- **Tentatives 1-4**: 25 minutes
- **Solution finale**: 5 minutes
- **Total**: ~30 minutes

---

## 🔧 Commandes Utiles

### Vérifier type colonne
```sql
SELECT pg_typeof(geom) FROM plots LIMIT 1;
```

### Tester conversion
```sql
SELECT ST_AsGeoJSON(geom)::jsonb FROM plots LIMIT 1;
```

### Vérifier schéma complet
```sql
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'plots';
```

---

**Date**: 1er octobre 2025  
**Statut**: ✅ RÉSOLU  
**Migration finale**: 20251001115500

