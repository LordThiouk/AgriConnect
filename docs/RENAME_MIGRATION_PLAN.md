# 🔄 Plan de Migration: Renommage farm_file_plots → plots

## 📊 Résultats de l'Analyse

**Date**: 1er octobre 2025  
**Script**: `npm run analyze:rename`

### Situation Actuelle

```
┌──────────────────────────────────────────────────────────────┐
│  DÉCOUVERTE MAJEURE                                          │
├──────────────────────────────────────────────────────────────┤
│  • farm_file_plots = ANCIENNE table plots (renommée)        │
│  • plots actuelle = OBSOLÈTE (créée en doublon)             │
│  • 14 lignes orphelines dans l'ancienne plots               │
│  • Plusieurs tables utilisent ENCORE l'ancienne plot_id     │
└──────────────────────────────────────────────────────────────┘
```

### État des Tables

| Table | plots (obsolète) | farm_file_plots (vraie) |
|-------|------------------|-------------------------|
| **Lignes** | 29 | 24 |
| **Colonnes** | 8 | 22 |
| **Données complètes** | ❌ Minimales | ✅ Complètes |

### Utilisation des Colonnes

| Table | plot_id (obsolète) | farm_file_plot_id (actuelle) |
|-------|-------------------|------------------------------|
| **crops** | ⚠️ 41 lignes | ✅ 62 lignes |
| **operations** | ⚠️ 10 lignes | ❌ N'existe pas |
| **observations** | ⚠️ 4 lignes | ❌ N'existe pas |
| **visits** | ⚠️ 16 lignes | ❌ N'existe pas |
| **recommendations** | ⚠️ 4 lignes | ❌ N'existe pas |
| **media** | ✅ 0 ligne | ❌ N'existe pas |

### Lignes Orphelines (14)

Lignes dans l'ancienne `plots` qui n'ont pas de correspondance dans `farm_file_plots`:

1. **8 parcelles de test** (producer_id = NULL) - Créées en septembre 2025
2. **6 parcelles réelles** avec producteurs - Créées le 26/09/2025

**⚠️ Décision requise** : Ces 14 lignes doivent-elles être migrées ou peuvent-elles être supprimées ?

---

## 🎯 Plan de Migration Détaillé

### ⚠️ **IMPORTANT : Complexité Augmentée**

La migration est plus complexe que prévu car :
1. Plusieurs tables n'ont **PAS** encore `farm_file_plot_id`
2. Des données référencent l'ancienne `plots` via `plot_id`
3. Il faut d'abord **ajouter les colonnes** et **migrer les données**

---

## Phase 1: Préparation et Backup

### Migration 1.1: Backup de l'ancienne table

```sql
-- Migration: 20251001100000_backup_old_plots_table.sql

-- Créer une sauvegarde complète de l'ancienne table plots
CREATE TABLE IF NOT EXISTS public.plots_obsolete_backup AS 
SELECT * FROM public.plots;

-- Ajouter métadonnées
COMMENT ON TABLE public.plots_obsolete_backup IS 
  'Backup de l''ancienne table plots avant migration (date: 2025-10-01). Contient 29 lignes dont 14 orphelines.';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Backup créé: % lignes sauvegardées', 
    (SELECT COUNT(*) FROM public.plots_obsolete_backup);
END $$;
```

### Migration 1.2: Analyse des orphelins

```sql
-- Migration: 20251001100100_analyze_orphan_plots.sql

-- Créer une vue pour analyser les orphelins
CREATE OR REPLACE VIEW public.v_orphan_plots AS
SELECT 
  p.*,
  CASE 
    WHEN p.producer_id IS NULL THEN 'Test data'
    WHEN p.created_at >= '2025-09-26' THEN 'Recent production data'
    ELSE 'Old production data'
  END AS orphan_type
FROM public.plots p
WHERE NOT EXISTS (
  SELECT 1 FROM public.farm_file_plots ffp
  WHERE ffp.plot_id = p.id
);

-- Statistiques
SELECT orphan_type, COUNT(*) as count
FROM public.v_orphan_plots
GROUP BY orphan_type;
```

**Action manuelle requise** : Décider du sort des 14 lignes orphelines

---

## Phase 2: Ajout des Colonnes Manquantes

### Migration 2.1: Ajouter farm_file_plot_id aux tables

```sql
-- Migration: 20251001101000_add_farm_file_plot_id_columns.sql

-- Ajouter la colonne à operations
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID;

-- Ajouter la colonne à observations
ALTER TABLE public.observations
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID;

-- Ajouter la colonne à visits  
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID;

-- Ajouter la colonne à recommendations
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS farm_file_plot_id UUID;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_operations_farm_file_plot_id 
  ON public.operations(farm_file_plot_id);

CREATE INDEX IF NOT EXISTS idx_observations_farm_file_plot_id 
  ON public.observations(farm_file_plot_id);

CREATE INDEX IF NOT EXISTS idx_visits_farm_file_plot_id 
  ON public.visits(farm_file_plot_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_farm_file_plot_id 
  ON public.recommendations(farm_file_plot_id);

-- Commentaires
COMMENT ON COLUMN public.operations.farm_file_plot_id IS 
  'Référence vers farm_file_plots (future table plots après renommage)';
COMMENT ON COLUMN public.observations.farm_file_plot_id IS 
  'Référence vers farm_file_plots (future table plots après renommage)';
COMMENT ON COLUMN public.visits.farm_file_plot_id IS 
  'Référence vers farm_file_plots (future table plots après renommage)';
COMMENT ON COLUMN public.recommendations.farm_file_plot_id IS 
  'Référence vers farm_file_plots (future table plots après renommage)';
```

---

## Phase 3: Migration des Données

### Migration 3.1: Mapper les anciennes références

```sql
-- Migration: 20251001102000_migrate_plot_id_to_farm_file_plot_id.sql

-- STRATÉGIE: Utiliser farm_file_plots.plot_id pour mapper
-- car plot_id dans farm_file_plots référence l'ancienne plots.id

-- Table operations
UPDATE public.operations o
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE o.plot_id = ffp.plot_id
  AND o.farm_file_plot_id IS NULL;

-- Log
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'operations: % lignes mises à jour', v_updated;
END $$;

-- Table observations
UPDATE public.observations o
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE o.plot_id = ffp.plot_id
  AND o.farm_file_plot_id IS NULL;

-- Table visits
UPDATE public.visits v
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE v.plot_id = ffp.plot_id
  AND v.farm_file_plot_id IS NULL;

-- Table recommendations
UPDATE public.recommendations r
SET farm_file_plot_id = ffp.id
FROM public.farm_file_plots ffp
WHERE r.plot_id = ffp.plot_id
  AND r.farm_file_plot_id IS NULL;

-- Vérification
SELECT 
  'operations' as table_name,
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NOT NULL) as migrated,
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NULL AND plot_id IS NOT NULL) as remaining
FROM public.operations
UNION ALL
SELECT 
  'observations',
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NOT NULL),
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NULL AND plot_id IS NOT NULL)
FROM public.observations
UNION ALL
SELECT 
  'visits',
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NOT NULL),
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NULL AND plot_id IS NOT NULL)
FROM public.visits
UNION ALL
SELECT 
  'recommendations',
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NOT NULL),
  COUNT(*) FILTER (WHERE farm_file_plot_id IS NULL AND plot_id IS NOT NULL)
FROM public.recommendations;
```

### Migration 3.2: Gérer les lignes non mappées

```sql
-- Migration: 20251001102100_handle_unmapped_plot_references.sql

-- Identifier les lignes qui référencent des plots orphelins
CREATE TEMP TABLE orphan_references AS
SELECT 
  'operations' as table_name,
  o.id as record_id,
  o.plot_id as orphan_plot_id
FROM public.operations o
WHERE o.plot_id IS NOT NULL
  AND o.farm_file_plot_id IS NULL
UNION ALL
SELECT 
  'observations',
  o.id,
  o.plot_id
FROM public.observations o
WHERE o.plot_id IS NOT NULL
  AND o.farm_file_plot_id IS NULL
UNION ALL
SELECT 
  'visits',
  v.id,
  v.plot_id
FROM public.visits v
WHERE v.plot_id IS NOT NULL
  AND v.farm_file_plot_id IS NULL
UNION ALL
SELECT 
  'recommendations',
  r.id,
  r.plot_id
FROM public.recommendations r
WHERE r.plot_id IS NOT NULL
  AND r.farm_file_plot_id IS NULL;

-- Afficher le résumé
SELECT 
  table_name,
  COUNT(*) as unmapped_count
FROM orphan_references
GROUP BY table_name;

-- ⚠️ DÉCISION REQUISE:
-- Option 1: Migrer les plots orphelins vers farm_file_plots
-- Option 2: Supprimer ces références (données de test probablement)
-- Option 3: Créer des entrées fictives dans farm_file_plots

-- Pour l'instant, on log juste
RAISE NOTICE 'Total références orphelines: %', 
  (SELECT COUNT(*) FROM orphan_references);
```

---

## Phase 4: Suppression de l'Ancienne Table

### Migration 4.1: Supprimer les contraintes FK

```sql
-- Migration: 20251001103000_drop_old_plots_constraints.sql

-- Supprimer les contraintes FK vers l'ancienne table plots
-- (Les contraintes exactes dépendent de votre schéma)

-- Dans crops (si constraint existe)
ALTER TABLE public.crops
  DROP CONSTRAINT IF EXISTS crops_plot_id_fkey CASCADE;

-- Dans operations
ALTER TABLE public.operations
  DROP CONSTRAINT IF EXISTS operations_plot_id_fkey CASCADE;

-- Dans observations
ALTER TABLE public.observations
  DROP CONSTRAINT IF EXISTS observations_plot_id_fkey CASCADE;

-- Dans visits
ALTER TABLE public.visits
  DROP CONSTRAINT IF EXISTS visits_plot_id_fkey CASCADE;

-- Dans recommendations
ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_plot_id_fkey CASCADE;

RAISE NOTICE 'Contraintes FK vers ancienne plots supprimées';
```

### Migration 4.2: Supprimer l'ancienne table plots

```sql
-- Migration: 20251001103100_drop_old_plots_table.sql

-- ⚠️ POINT DE NON-RETOUR
-- Assurez-vous que le backup existe et que les données sont migrées

-- Vérifier le backup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'plots_obsolete_backup'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Backup plots_obsolete_backup introuvable. Migration annulée.';
  END IF;
  
  RAISE NOTICE 'Backup vérifié OK';
END $$;

-- Supprimer la table obsolète
DROP TABLE IF EXISTS public.plots CASCADE;

RAISE NOTICE 'Ancienne table plots supprimée';
```

---

## Phase 5: Renommage farm_file_plots → plots

### Migration 5.1: Renommer la table principale

```sql
-- Migration: 20251001104000_rename_farm_file_plots_to_plots.sql

-- Renommer la table
ALTER TABLE public.farm_file_plots 
  RENAME TO plots;

-- Renommer la colonne plot_id → plot_id_legacy (temporaire)
ALTER TABLE public.plots 
  RENAME COLUMN plot_id TO plot_id_legacy;

-- Commentaires
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles. Anciennement nommée farm_file_plots (migration 2025-10-01).';

COMMENT ON COLUMN public.plots.plot_id_legacy IS 
  'Ancienne référence vers la table plots obsolète. À supprimer après validation.';

RAISE NOTICE 'Table renommée: farm_file_plots → plots';
```

---

## Phase 6: Renommage des Colonnes

### Migration 6.1: Renommer farm_file_plot_id → plot_id

```sql
-- Migration: 20251001105000_rename_farm_file_plot_id_to_plot_id.sql

-- Table crops
ALTER TABLE public.crops 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;

-- Supprimer l'ancien plot_id
ALTER TABLE public.crops 
  DROP COLUMN IF EXISTS plot_id CASCADE;

-- Renommer plot_id_new → plot_id
ALTER TABLE public.crops 
  RENAME COLUMN plot_id_new TO plot_id;

-- Ajouter contrainte FK
ALTER TABLE public.crops
  ADD CONSTRAINT crops_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

-- Répéter pour les autres tables
-- operations
ALTER TABLE public.operations 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;
ALTER TABLE public.operations 
  DROP COLUMN IF EXISTS plot_id CASCADE;
ALTER TABLE public.operations 
  RENAME COLUMN plot_id_new TO plot_id;
ALTER TABLE public.operations
  ADD CONSTRAINT operations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

-- observations
ALTER TABLE public.observations 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;
ALTER TABLE public.observations 
  DROP COLUMN IF EXISTS plot_id CASCADE;
ALTER TABLE public.observations 
  RENAME COLUMN plot_id_new TO plot_id;
ALTER TABLE public.observations
  ADD CONSTRAINT observations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

-- visits
ALTER TABLE public.visits 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;
ALTER TABLE public.visits 
  DROP COLUMN IF EXISTS plot_id CASCADE;
ALTER TABLE public.visits 
  RENAME COLUMN plot_id_new TO plot_id;
ALTER TABLE public.visits
  ADD CONSTRAINT visits_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

-- recommendations
ALTER TABLE public.recommendations 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;
ALTER TABLE public.recommendations 
  DROP COLUMN IF EXISTS plot_id CASCADE;
ALTER TABLE public.recommendations 
  RENAME COLUMN plot_id_new TO plot_id;
ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

RAISE NOTICE 'Colonnes renommées: farm_file_plot_id → plot_id';
```

---

## Phase 7: Tests et Validation

### Script de Test

```javascript
// tests/migration/rename-validation.test.js

describe('Migration: farm_file_plots → plots', () => {
  test('Table plots existe', async () => {
    const { data, error } = await supabase
      .from('plots')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('Table farm_file_plots n\'existe plus', async () => {
    const { error } = await supabase
      .from('farm_file_plots')
      .select('id')
      .limit(1);
    
    expect(error).toBeDefined();
    expect(error.message).toContain('does not exist');
  });

  test('Colonnes plot_id fonctionnent', async () => {
    const { data: crops } = await supabase
      .from('crops')
      .select('id, plot_id')
      .not('plot_id', 'is', null)
      .limit(1);
    
    expect(crops).toBeDefined();
    expect(crops[0].plot_id).toBeDefined();
  });

  test('Relations FK fonctionnent', async () => {
    const { data: plotsWithCrops } = await supabase
      .from('plots')
      .select(`
        id,
        name_season_snapshot,
        crops(id, crop_type)
      `)
      .limit(1);
    
    expect(plotsWithCrops).toBeDefined();
  });
});
```

---

## Phase 8: Nettoyage Final

### Migration 8.1: Supprimer les colonnes legacy

```sql
-- Migration: 20251001106000_cleanup_legacy_columns.sql

-- Supprimer plot_id_legacy de plots (après validation)
ALTER TABLE public.plots 
  DROP COLUMN IF EXISTS plot_id_legacy CASCADE;

-- Supprimer le backup (optionnel, après plusieurs semaines)
-- DROP TABLE IF EXISTS public.plots_obsolete_backup;

-- Mettre à jour les commentaires
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles. Migration farm_file_plots → plots complétée le 2025-10-01.';

RAISE NOTICE 'Nettoyage terminé';
```

---

## 📋 Checklist de Migration

### Avant la Migration

- [ ] **Backup complet** de la base de données
- [ ] **Environnement de staging** prêt et synchronisé
- [ ] **Décision prise** sur les 14 lignes orphelines
- [ ] **Tests préparés** (script de validation)
- [ ] **Communication** avec l'équipe

### Pendant la Migration

- [ ] Phase 1: Backup ✓
- [ ] Phase 2: Ajout colonnes ✓
- [ ] Phase 3: Migration données ✓
- [ ] Phase 4: Suppression ancienne table ✓
- [ ] Phase 5: Renommage table ✓
- [ ] Phase 6: Renommage colonnes ✓
- [ ] Phase 7: Tests ✓
- [ ] Phase 8: Nettoyage ✓

### Après la Migration

- [ ] **Tests de régression** complets
- [ ] **Validation frontend** (web + mobile)
- [ ] **Monitoring** actif (24h minimum)
- [ ] **Documentation** mise à jour
- [ ] **Équipe informée** du succès

---

## ⚠️ Points Critiques

1. **Les 14 lignes orphelines** : Décider avant la migration
2. **Références non mappées** : Vérifier après Phase 3
3. **RLS Policies** : Vérifier qu'elles fonctionnent après renommage
4. **Frontend** : Grande mise à jour nécessaire (toutes les références)
5. **Rollback** : Possible jusqu'à Phase 4 (suppression table)

---

## 🔄 Plan de Rollback

Si problème détecté **AVANT Phase 4** (suppression plots):

```sql
-- Restaurer l'état initial
ALTER TABLE public.plots RENAME TO farm_file_plots;
-- Supprimer les colonnes ajoutées
ALTER TABLE operations DROP COLUMN farm_file_plot_id;
-- etc.
```

Si problème **APRÈS Phase 4** (renommage fait):

```sql
-- Restaurer depuis le backup
CREATE TABLE plots AS SELECT * FROM plots_obsolete_backup;
-- Re-créer les contraintes
-- Ajuster les données
```

---

## 📅 Timeline Estimée

| Phase | Durée | Description |
|-------|-------|-------------|
| 1. Backup | 30min | Sauvegarde et analyse |
| 2. Ajout colonnes | 1h | Ajout farm_file_plot_id |
| 3. Migration données | 2h | Mapping et validation |
| 4. Suppression | 30min | Drop ancienne plots |
| 5. Renommage table | 15min | farm_file_plots → plots |
| 6. Renommage colonnes | 1h | farm_file_plot_id → plot_id |
| 7. Tests | 2h | Validation complète |
| 8. Nettoyage | 30min | Suppression legacy |
| **TOTAL** | **~8h** | Migration complète |

**+ Frontend**: 1-2 jours supplémentaires

---

**Prochaine étape** : Décider du sort des 14 lignes orphelines et commencer par Phase 1 (Backup).

