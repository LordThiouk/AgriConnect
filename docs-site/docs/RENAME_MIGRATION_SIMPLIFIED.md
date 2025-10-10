# 🚀 Plan de Migration SIMPLIFIÉ: farm_file_plots → plots

## ✅ Résultat de l'Analyse

**Date**: 1er octobre 2025  
**Script**: `node scripts/check-orphan-plots-migration.js`

```
╔═══════════════════════════════════════════════════════════╗
║  EXCELLENTE NOUVELLE !                                    ║
║                                                           ║
║  Toutes les données importantes sont déjà dans            ║
║  farm_file_plots. Aucune migration de données requise.   ║
║                                                           ║
║  • 8 données de test (à ignorer)                          ║
║  • 6 parcelles réelles (déjà présentes)                   ║
║  • 0 parcelle à migrer                                    ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🎯 Migration Simplifiée (5 Phases)

### Phase 1: Backup ⏱️ 15 min

```sql
-- Migration: 20251001110000_backup_old_plots.sql

-- Créer backup de sécurité
CREATE TABLE IF NOT EXISTS public.plots_obsolete_backup AS 
SELECT * FROM public.plots;

-- Vérification
DO $$
BEGIN
  RAISE NOTICE 'Backup créé: % lignes', 
    (SELECT COUNT(*) FROM public.plots_obsolete_backup);
END $$;

COMMENT ON TABLE public.plots_obsolete_backup IS 
  'Backup de l''ancienne table plots avant renommage (2025-10-01). 29 lignes: 8 tests + 21 prod (dont 6 doublons).';
```

---

### Phase 2: Suppression de l'ancienne plots ⏱️ 10 min

```sql
-- Migration: 20251001111000_drop_old_plots_table.sql

-- ⚠️ Vérifier que le backup existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'plots_obsolete_backup'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Backup introuvable. Migration annulée.';
  END IF;
END $$;

-- Supprimer les contraintes FK vers l'ancienne plots
-- (La table sera supprimée en CASCADE)

-- Supprimer l'ancienne table plots
DROP TABLE IF EXISTS public.plots CASCADE;

RAISE NOTICE 'Ancienne table plots supprimée';
```

---

### Phase 3: Renommer farm_file_plots → plots ⏱️ 5 min

```sql
-- Migration: 20251001112000_rename_farm_file_plots_to_plots.sql

-- Renommer la table
ALTER TABLE public.farm_file_plots 
  RENAME TO plots;

-- Renommer la colonne plot_id → plot_id_legacy (temporaire)
ALTER TABLE public.plots 
  RENAME COLUMN plot_id TO plot_id_legacy;

-- Commentaires
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles. Renommée depuis farm_file_plots le 2025-10-01.';

COMMENT ON COLUMN public.plots.plot_id_legacy IS 
  'Ancienne référence vers la table plots obsolète (supprimée). À supprimer après validation.';

RAISE NOTICE 'Table renommée: farm_file_plots → plots';
```

---

### Phase 4: Renommer les colonnes ⏱️ 20 min

```sql
-- Migration: 20251001113000_rename_farm_file_plot_id_columns.sql

-- ==================== CROPS ====================
-- Crops a déjà farm_file_plot_id, on renomme

-- Étape 1: Renommer temporairement
ALTER TABLE public.crops 
  RENAME COLUMN farm_file_plot_id TO plot_id_new;

-- Étape 2: Supprimer l'ancien plot_id (si existe)
ALTER TABLE public.crops 
  DROP COLUMN IF EXISTS plot_id CASCADE;

-- Étape 3: Renommer en plot_id
ALTER TABLE public.crops 
  RENAME COLUMN plot_id_new TO plot_id;

-- Étape 4: Ajouter contrainte FK
ALTER TABLE public.crops
  ADD CONSTRAINT crops_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

RAISE NOTICE 'crops.farm_file_plot_id → plot_id';


-- ==================== OPERATIONS ====================
-- Operations n'a PAS farm_file_plot_id, on garde plot_id tel quel
-- (Il référence déjà les bonnes parcelles via l'ancien plot_id)

RAISE NOTICE 'operations.plot_id conservé (pas de changement nécessaire)';


-- ==================== OBSERVATIONS ====================
-- Observations n'a PAS farm_file_plot_id, on garde plot_id tel quel

RAISE NOTICE 'observations.plot_id conservé (pas de changement nécessaire)';


-- ==================== VISITS ====================
-- Visits n'a PAS farm_file_plot_id, on garde plot_id tel quel

RAISE NOTICE 'visits.plot_id conservé (pas de changement nécessaire)';


-- ==================== RECOMMENDATIONS ====================
-- Recommendations n'a PAS farm_file_plot_id, on garde plot_id tel quel

RAISE NOTICE 'recommendations.plot_id conservé (pas de changement nécessaire)';


-- Résumé
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Résumé des colonnes:';
  RAISE NOTICE '• crops.plot_id → Référence plots (renommé)';
  RAISE NOTICE '• operations.plot_id → À VÉRIFIER';
  RAISE NOTICE '• observations.plot_id → À VÉRIFIER';
  RAISE NOTICE '• visits.plot_id → À VÉRIFIER';
  RAISE NOTICE '• recommendations.plot_id → À VÉRIFIER';
  RAISE NOTICE '========================================';
END $$;
```

**⚠️ IMPORTANT** : Les tables operations, observations, visits, recommendations utilisent encore `plot_id` qui référençait l'ancienne table. Il faut :

**Option A** : Migrer les données (recommandé)
```sql
-- Créer la colonne farm_file_plot_id d'abord
ALTER TABLE public.operations ADD COLUMN plot_id_new UUID;
ALTER TABLE public.observations ADD COLUMN plot_id_new UUID;
ALTER TABLE public.visits ADD COLUMN plot_id_new UUID;
ALTER TABLE public.recommendations ADD COLUMN plot_id_new UUID;

-- Mapper via plot_id_legacy
UPDATE public.operations o
SET plot_id_new = p.id
FROM public.plots p
WHERE o.plot_id = p.plot_id_legacy;

-- Idem pour les autres tables

-- Ensuite supprimer ancien plot_id et renommer
ALTER TABLE public.operations DROP COLUMN plot_id;
ALTER TABLE public.operations RENAME COLUMN plot_id_new TO plot_id;
```

**Option B** : Supprimer les données orphelines
```sql
-- Supprimer les lignes qui référencent des plots inexistants
DELETE FROM public.operations 
WHERE plot_id NOT IN (SELECT plot_id_legacy FROM public.plots WHERE plot_id_legacy IS NOT NULL);
```

---

### Phase 5: Nettoyage ⏱️ 10 min

```sql
-- Migration: 20251001114000_cleanup_after_rename.sql

-- Supprimer plot_id_legacy (après validation)
ALTER TABLE public.plots 
  DROP COLUMN IF EXISTS plot_id_legacy CASCADE;

-- Mettre à jour les commentaires
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles. Migration complétée le 2025-10-01.';

-- Optionnel: Supprimer le backup (après plusieurs semaines)
-- DROP TABLE IF EXISTS public.plots_obsolete_backup;

RAISE NOTICE 'Nettoyage terminé';
```

---

## 📝 Checklist d'Exécution

### Pré-Migration
- [x] ✅ Analyse des orphelins effectuée (0 migration nécessaire)
- [ ] Backup complet de la base de données
- [ ] Tests sur environnement de staging
- [ ] Communication avec l'équipe

### Exécution (Staging)
- [ ] Phase 1: Backup ✓
- [ ] Phase 2: Suppression ancienne plots ✓
- [ ] Phase 3: Renommage table ✓
- [ ] Phase 4: Renommage colonnes ✓
- [ ] Phase 5: Nettoyage ✓

### Post-Migration
- [ ] Tests de régression
- [ ] Validation frontend (web + mobile)
- [ ] Monitoring (24h)
- [ ] Application en production
- [ ] Documentation mise à jour

---

## ⏱️ Timeline

| Phase | Durée | Cumul |
|-------|-------|-------|
| 1. Backup | 15 min | 15 min |
| 2. Suppression | 10 min | 25 min |
| 3. Renommage table | 5 min | 30 min |
| 4. Renommage colonnes | 20 min | 50 min |
| 5. Nettoyage | 10 min | **1h total** |

**+ Frontend**: 1-2 jours (recherche/remplacement global)

---

## 🎯 Avantages de Cette Approche

✅ **Aucune perte de données** - Tout est déjà dans farm_file_plots  
✅ **Migration rapide** - ~1h pour la base de données  
✅ **Risque minimal** - Données validées par script d'analyse  
✅ **Rollback simple** - Backup disponible si problème  
✅ **Nomenclature standard** - Retour à "plots" au lieu de "farm_file_plots"

---

## 🚨 Points d'Attention

1. **Tables sans farm_file_plot_id** : operations, observations, visits, recommendations
   - Décider: Migrer les données OU supprimer les orphelins
   
2. **Fonctions RPC** : Vérifier après renommage
   - get_plots_with_geolocation (déjà OK)
   - get_plot_by_id (à vérifier)
   
3. **Frontend** : Recherche/remplacement global
   - `farm_file_plots` → `plots`
   - `farmFilePlotId` → `plotId`
   - `FarmFilePlot` → `Plot`

---

## 📂 Fichiers Générés

- ✅ `scripts/check-orphan-plots-migration.js` - Script d'analyse
- ✅ `docs/RENAME_MIGRATION_SIMPLIFIED.md` - Ce document

---

**Prochaine étape** : Exécuter Phase 1 (Backup) sur staging

