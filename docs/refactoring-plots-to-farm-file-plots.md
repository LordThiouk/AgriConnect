# Refactoring: plots → farm_file_plots

## 📊 Résultats de l'Analyse

**Date**: 1er octobre 2025  
**Script**: `scripts/analyze-farm-file-plots-vs-plots.js`

### État Actuel

| Métrique | plots | farm_file_plots |
|----------|-------|-----------------|
| **Nombre de lignes** | 29 | 24 |
| **Nombre de colonnes** | 8 | 22 |
| **Tables dépendantes** | 6 | 3 |
| **Fonctions RPC** | 2 | 5 |

### 🔍 Colonnes

#### Colonnes Communes (6)
- `id`
- `producer_id`
- `geom`
- `created_at`
- `updated_at`
- `cooperative_id`

#### Colonnes Uniquement dans `plots` (2)
- ⚠️ `name` - **À migrer**
- ⚠️ `created_by` - **À migrer**

#### Colonnes Uniquement dans `farm_file_plots` (16)
- ✅ `name_season_snapshot`
- ✅ `area_hectares`
- ✅ `soil_type`
- ✅ `soil_ph`
- ✅ `water_source`
- ✅ `irrigation_type`
- ✅ `slope_percent`
- ✅ `elevation_meters`
- ✅ `center_point`
- ✅ `status`
- ✅ `notes`
- ✅ `farm_file_id`
- ✅ `typology`
- ✅ `producer_size`
- ✅ `cotton_variety`
- ✅ `plot_id` (référence vers plots)

### 🔗 Dépendances Identifiées

#### Tables Référençant `plots` (6)
1. ⚠️ `crops.plot_id`
2. ⚠️ `operations.plot_id`
3. ⚠️ `observations.plot_id`
4. ⚠️ `visits.plot_id`
5. ⚠️ `recommendations.plot_id`
6. ⚠️ `media.entity_id` (quand entity_type='plot')

#### Tables Référençant `farm_file_plots` (3)
1. ✅ `crops.farm_file_plot_id`
2. ✅ `operations.farm_file_plot_id`
3. ✅ `observations.farm_file_plot_id`

#### Fonctions RPC Utilisant `plots` (2)
1. ⚠️ `get_plot_by_id`
2. ⚠️ `delete_plot_cascade`

#### Fonctions RPC Utilisant `farm_file_plots` (5)
1. ✅ `get_plots_with_geolocation`
2. ✅ `get_plots_with_geolocation_count`
3. ✅ `get_plot_by_id` (utilise aussi plots)
4. ✅ `get_plots_by_producer`
5. ✅ `get_agent_today_visits`

### 📈 Analyse de Chevauchement

- **farm_file_plots avec plot_id non null**: 24 lignes (100%)
- **farm_file_plots avec plot_id null**: 0 ligne
- **plots sans correspondance**: 5 lignes (29 - 24 = 5)

**Conclusion**: La plupart des données de `farm_file_plots` référencent correctement `plots`, mais il y a 5 lignes dans `plots` qui n'ont pas de correspondance dans `farm_file_plots`.

---

## 🎯 Plan de Refactoring

### Phase 1: Audit et Préparation ✅

- [x] Exécuter le script d'analyse
- [x] Identifier toutes les dépendances
- [x] Documenter les différences de structure
- [ ] Identifier les 5 lignes manquantes dans farm_file_plots

### Phase 2: Migration des Colonnes

**Objectif**: Ajouter les colonnes manquantes à `farm_file_plots`

#### Migration à Créer

```sql
-- Migration: 20251001090000_add_missing_columns_to_farm_file_plots.sql

-- Ajouter les colonnes manquantes
ALTER TABLE public.farm_file_plots
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Note: 'name' existe déjà sous forme de 'name_season_snapshot'
-- Pas besoin de migration pour cette colonne

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_farm_file_plots_created_by 
  ON public.farm_file_plots(created_by);

-- Commentaires
COMMENT ON COLUMN public.farm_file_plots.created_by IS 
  'Profil de l''utilisateur qui a créé la parcelle (migré depuis plots.created_by)';
```

### Phase 3: Migration des Données

**Objectif**: Transférer les 5 lignes manquantes de `plots` vers `farm_file_plots`

#### Script de Migration des Données

```sql
-- Migration: 20251001091000_migrate_plots_data_to_farm_file_plots.sql

-- Identifier les plots sans correspondance
WITH missing_plots AS (
  SELECT p.*
  FROM public.plots p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    WHERE ffp.plot_id = p.id
  )
)
-- Insérer dans farm_file_plots
INSERT INTO public.farm_file_plots (
  id,
  producer_id,
  cooperative_id,
  name_season_snapshot,
  area_hectares,
  soil_type,
  water_source,
  status,
  geom,
  center_point,
  plot_id,
  created_by,
  created_at,
  updated_at,
  farm_file_id
)
SELECT
  gen_random_uuid(),                    -- Nouvel ID pour farm_file_plots
  mp.producer_id,
  mp.cooperative_id,
  COALESCE(mp.name, 'Parcelle migrée'), -- name → name_season_snapshot
  0.5,                                   -- Valeur par défaut area_hectares
  'unknown',                             -- Valeur par défaut soil_type
  'unknown',                             -- Valeur par défaut water_source
  'active',                              -- Valeur par défaut status
  mp.geom,
  ST_Centroid(mp.geom),                  -- Calculer le centre
  mp.id,                                 -- Référence vers plots
  mp.created_by,
  mp.created_at,
  mp.updated_at,
  (SELECT id FROM public.farm_files WHERE producer_id = mp.producer_id LIMIT 1) -- Lier à un farm_file existant
FROM missing_plots mp;

-- Log du résultat
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.plots p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    WHERE ffp.plot_id = p.id
  );
  
  RAISE NOTICE 'Migration terminée. % plot(s) restant(s) sans correspondance.', v_count;
END $$;
```

### Phase 4: Migration des Tables Dépendantes

**Objectif**: Mettre à jour les 6 tables qui référencent `plots`

#### 4.1. Table `visits`

```sql
-- Migration: 20251001092000_migrate_visits_plot_to_farm_file_plot.sql

-- Ajouter la colonne farm_file_plot_id si elle n'existe pas
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID REFERENCES public.farm_file_plots(id);

-- Migrer les données existantes
UPDATE public.visits v
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE v.plot_id = ffp.plot_id
  AND v.farm_file_plot_id IS NULL;

-- Rendre la nouvelle colonne NOT NULL après migration
ALTER TABLE public.visits
  ALTER COLUMN farm_file_plot_id SET NOT NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_visits_farm_file_plot_id
  ON public.visits(farm_file_plot_id);

-- Note: Garder plot_id temporairement pour compatibilité
-- On le supprimera en Phase 5
```

#### 4.2. Table `recommendations`

```sql
-- Migration: 20251001092100_migrate_recommendations_plot_to_farm_file_plot.sql

-- Même approche que visits
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID REFERENCES public.farm_file_plots(id);

UPDATE public.recommendations r
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE r.plot_id = ffp.plot_id
  AND r.farm_file_plot_id IS NULL;

ALTER TABLE public.recommendations
  ALTER COLUMN farm_file_plot_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recommendations_farm_file_plot_id
  ON public.recommendations(farm_file_plot_id);
```

#### 4.3. Table `media` (cas spécial)

```sql
-- Migration: 20251001092200_migrate_media_plot_entity_to_farm_file_plot.sql

-- Mettre à jour entity_id pour les médias de type 'plot'
UPDATE public.media m
SET 
  entity_id = ffp.id,
  entity_type = 'farm_file_plot'
FROM public.farm_file_plots ffp
WHERE m.entity_type = 'plot'
  AND m.entity_id = ffp.plot_id;

-- Ajouter un CHECK constraint pour le nouveau type
ALTER TABLE public.media
  DROP CONSTRAINT IF EXISTS media_entity_type_check;

ALTER TABLE public.media
  ADD CONSTRAINT media_entity_type_check
  CHECK (entity_type IN ('plot', 'farm_file_plot', 'crop', 'operation', 'observation', 'producer'));
```

**Note**: Les tables `crops`, `operations`, `observations` ont déjà `farm_file_plot_id`, donc pas de migration nécessaire.

### Phase 5: Migration des Fonctions RPC

**Objectif**: Mettre à jour les 2 fonctions RPC utilisant directement `plots`

#### 5.1. Fonction `get_plot_by_id`

```sql
-- Migration: 20251001093000_update_get_plot_by_id_use_farm_file_plots.sql

DROP FUNCTION IF EXISTS public.get_plot_by_id(UUID);

CREATE OR REPLACE FUNCTION public.get_plot_by_id(plot_id_param UUID)
RETURNS TABLE (
  id UUID,
  producer_id UUID,
  producer_name TEXT,
  name TEXT,
  area_hectares NUMERIC,
  soil_type TEXT,
  water_source TEXT,
  status TEXT,
  geom JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Statistiques
  total_crops BIGINT,
  total_operations BIGINT,
  total_observations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ffp.id,
    ffp.producer_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Producteur inconnu') AS producer_name,
    ffp.name_season_snapshot AS name,
    ffp.area_hectares,
    ffp.soil_type,
    ffp.water_source,
    ffp.status,
    ffp.geom,
    ffp.created_at,
    ffp.updated_at,
    -- Statistiques
    (SELECT COUNT(*) FROM public.crops c WHERE c.farm_file_plot_id = ffp.id) AS total_crops,
    (SELECT COUNT(*) FROM public.operations o WHERE o.farm_file_plot_id = ffp.id) AS total_operations,
    (SELECT COUNT(*) FROM public.observations ob WHERE ob.farm_file_plot_id = ffp.id) AS total_observations
  FROM public.farm_file_plots ffp
  LEFT JOIN public.producers p ON p.id = ffp.producer_id
  WHERE ffp.id = plot_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.2. Fonction `delete_plot_cascade`

```sql
-- Migration: 20251001093100_update_delete_plot_cascade_use_farm_file_plots.sql

DROP FUNCTION IF EXISTS public.delete_plot_cascade(UUID);

CREATE OR REPLACE FUNCTION public.delete_plot_cascade(plot_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN := FALSE;
BEGIN
  -- Supprimer en cascade depuis farm_file_plots
  DELETE FROM public.visits WHERE farm_file_plot_id = plot_id_param;
  DELETE FROM public.observations WHERE farm_file_plot_id = plot_id_param;
  DELETE FROM public.operations WHERE farm_file_plot_id = plot_id_param;
  DELETE FROM public.recommendations WHERE farm_file_plot_id = plot_id_param;
  DELETE FROM public.crops WHERE farm_file_plot_id = plot_id_param;
  DELETE FROM public.media WHERE entity_type = 'farm_file_plot' AND entity_id = plot_id_param;
  
  -- Supprimer la parcelle elle-même
  DELETE FROM public.farm_file_plots WHERE id = plot_id_param;
  
  IF FOUND THEN
    v_deleted := TRUE;
  END IF;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 6: Migration du Frontend

**Objectif**: Mettre à jour les références dans le code

#### 6.1. Recherche des Références

```bash
# Dans le projet, exécuter:
grep -r "\.from('plots')" web/src mobile/app mobile/lib lib
grep -r "from\s*plots" web/src mobile/app mobile/lib lib
grep -r "plot_id" web/src mobile/app mobile/lib lib | grep -v "farm_file_plot"
```

#### 6.2. Services à Mettre à Jour

**Web (`web/src/services/plots.ts`)**:
- Remplacer `.from('plots')` par `.from('farm_file_plots')`
- Mettre à jour les interfaces TypeScript

**Mobile (`mobile/lib/services/plots.ts`)**:
- Même approche que web

#### 6.3. Hooks à Mettre à Jour

**Mobile (`mobile/hooks/usePlots.ts`)**:
- Mettre à jour les requêtes Supabase

### Phase 7: Tests de Régression

**Objectif**: Valider que tout fonctionne après migration

#### Tests à Créer

```javascript
// tests/refactoring/plots-migration.test.js

describe('Plots Migration to farm_file_plots', () => {
  test('All plots have correspondence in farm_file_plots', async () => {
    const { data: plots } = await supabase.from('plots').select('id');
    const { data: farmFilePlots } = await supabase
      .from('farm_file_plots')
      .select('plot_id');
    
    const plotIds = new Set(plots.map(p => p.id));
    const farmFilePlotIds = new Set(farmFilePlots.map(ffp => ffp.plot_id));
    
    const missing = [...plotIds].filter(id => !farmFilePlotIds.has(id));
    expect(missing).toHaveLength(0);
  });

  test('get_plot_by_id returns correct data', async () => {
    const { data } = await supabase.rpc('get_plot_by_id', {
      plot_id_param: 'some-uuid'
    });
    
    expect(data).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.area_hectares).toBeDefined();
  });

  // Plus de tests...
});
```

### Phase 8: Créer Vue Legacy

**Objectif**: Compatibilité descendante

```sql
-- Migration: 20251001094000_create_plots_legacy_view.sql

-- Créer une vue 'plots_legacy' qui pointe vers farm_file_plots
CREATE OR REPLACE VIEW public.plots_legacy AS
SELECT
  ffp.id,
  ffp.producer_id,
  ffp.name_season_snapshot AS name,
  ffp.geom,
  ffp.created_at,
  ffp.updated_at,
  ffp.cooperative_id,
  ffp.created_by
FROM public.farm_file_plots ffp;

-- Commentaire explicatif
COMMENT ON VIEW public.plots_legacy IS 
  'Vue legacy pour compatibilité avec l''ancienne table plots. À supprimer après validation complète de la migration.';

-- Grant permissions
GRANT SELECT ON public.plots_legacy TO authenticated;
```

### Phase 9: Dépréciation de `plots`

**Objectif**: Marquer la table comme obsolète

```sql
-- Migration: 20251001095000_deprecate_plots_table.sql

-- Ajouter un commentaire de dépréciation
COMMENT ON TABLE public.plots IS 
  '⚠️ DEPRECATED: Cette table est obsolète. Utiliser farm_file_plots à la place. Planifiée pour suppression après validation complète de la migration (date: 2025-12-01).';

-- Révoquer les permissions d'écriture (lecture seule)
REVOKE INSERT, UPDATE, DELETE ON public.plots FROM authenticated;
GRANT SELECT ON public.plots TO authenticated;
```

### Phase 10: Suppression Finale (après validation)

**Date cible**: 1er décembre 2025 (après 2 mois de monitoring)

```sql
-- Migration: 20251201000000_drop_plots_table.sql

-- ⚠️ ATTENTION: Cette migration supprime définitivement la table plots
-- À exécuter SEULEMENT après validation complète de la migration

-- Supprimer les colonnes plot_id des tables dépendantes
ALTER TABLE public.visits DROP COLUMN IF EXISTS plot_id;
ALTER TABLE public.recommendations DROP COLUMN IF EXISTS plot_id;

-- Supprimer la vue legacy
DROP VIEW IF EXISTS public.plots_legacy;

-- Supprimer la table plots
DROP TABLE IF EXISTS public.plots CASCADE;

-- Log de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table plots supprimée définitivement.';
END $$;
```

---

## ⚠️ Risques et Mitigations

### Risques Identifiés

1. **Perte de données**
   - **Mitigation**: Backup complet avant migration + tests sur staging

2. **Rupture des clés étrangères**
   - **Mitigation**: Migration progressive avec colonnes temporaires

3. **Impact frontend**
   - **Mitigation**: Recherche exhaustive + tests de régression

4. **Performances**
   - **Mitigation**: Index appropriés + monitoring

5. **Rollback complexe**
   - **Mitigation**: Vue legacy + garder plots en lecture seule

### Checklist de Sécurité

- [ ] Backup complet de la base de données
- [ ] Tests sur environnement de staging
- [ ] Validation par l'équipe
- [ ] Plan de rollback documenté
- [ ] Monitoring activé
- [ ] Communication aux utilisateurs

---

## 📅 Timeline Proposé

| Phase | Durée | Date Début | Date Fin |
|-------|-------|------------|----------|
| Phase 1-2: Préparation | 2 jours | 2025-10-02 | 2025-10-03 |
| Phase 3-4: Migration données | 3 jours | 2025-10-04 | 2025-10-06 |
| Phase 5: Migration RPC | 2 jours | 2025-10-07 | 2025-10-08 |
| Phase 6: Migration frontend | 5 jours | 2025-10-09 | 2025-10-13 |
| Phase 7: Tests | 3 jours | 2025-10-14 | 2025-10-16 |
| Phase 8-9: Dépréciation | 1 jour | 2025-10-17 | 2025-10-17 |
| **Monitoring** | 2 mois | 2025-10-18 | 2025-12-01 |
| Phase 10: Suppression | 1 jour | 2025-12-01 | 2025-12-01 |

**Durée totale**: ~2.5 mois (incluant monitoring)

---

## 📝 Notes

- Ce document doit être mis à jour au fur et à mesure de la progression
- Tous les changements doivent être validés sur staging avant production
- Les tests de régression sont obligatoires à chaque phase
- La communication avec l'équipe est essentielle

## 🔗 Ressources

- Script d'analyse: `scripts/analyze-farm-file-plots-vs-plots.js`
- Documentation: `scripts/README_ANALYZE.md`
- Memory Bank: `.cursor/memory-bank/activeContext.md`

