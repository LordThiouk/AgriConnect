-- ============================================================================
-- PHASE 4: RENOMMAGE DES COLONNES → PLOT_ID
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 20 minutes
-- Objectif: Renommer farm_file_plot_id → plot_id et nettoyer les anciennes références
--
-- Contexte:
-- - Table plots existe maintenant (renommée depuis farm_file_plots)
-- - crops a farm_file_plot_id (62 lignes) → À renommer
-- - operations, observations, visits, recommendations ont plot_id (ancien) → À nettoyer
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATIONS PRÉALABLES
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
BEGIN
  -- Vérifier que plots existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table plots introuvable. Phase 3 non complétée.';
  END IF;
  
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications préalables:';
  RAISE NOTICE '✓ Table plots existe (% lignes)', v_plots_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 2. TABLE CROPS - RENOMMER FARM_FILE_PLOT_ID → PLOT_ID
-- ============================================================================

DO $$
DECLARE
  v_has_ffp_id BOOLEAN;
  v_has_old_plot_id BOOLEAN;
  v_ffp_count INTEGER := 0;
  v_old_plot_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: CROPS                          ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  -- Vérifier si farm_file_plot_id existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'crops'
      AND column_name = 'farm_file_plot_id'
  ) INTO v_has_ffp_id;
  
  -- Vérifier si plot_id existe déjà
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'crops'
      AND column_name = 'plot_id'
  ) INTO v_has_old_plot_id;
  
  IF v_has_ffp_id THEN
    SELECT COUNT(*) INTO v_ffp_count 
    FROM public.crops 
    WHERE farm_file_plot_id IS NOT NULL;
    RAISE NOTICE 'farm_file_plot_id existe: % lignes non-null', v_ffp_count;
  END IF;
  
  IF v_has_old_plot_id THEN
    SELECT COUNT(*) INTO v_old_plot_count 
    FROM public.crops 
    WHERE plot_id IS NOT NULL;
    RAISE NOTICE 'plot_id (ancien) existe: % lignes non-null', v_old_plot_count;
  END IF;
END $$;

-- Supprimer l'ancien plot_id s'il existe
ALTER TABLE public.crops 
  DROP COLUMN IF EXISTS plot_id CASCADE;

-- Renommer farm_file_plot_id → plot_id
ALTER TABLE public.crops 
  RENAME COLUMN farm_file_plot_id TO plot_id;

-- Ajouter contrainte FK
ALTER TABLE public.crops
  ADD CONSTRAINT crops_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ crops.farm_file_plot_id → plot_id (avec FK)';
END $$;

-- ============================================================================
-- 3. TABLE OPERATIONS - SUPPRIMER ANCIEN PLOT_ID
-- ============================================================================

DO $$
DECLARE
  v_has_plot_id BOOLEAN;
  v_plot_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: OPERATIONS                     ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  -- Vérifier si plot_id existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'operations'
      AND column_name = 'plot_id'
  ) INTO v_has_plot_id;
  
  IF v_has_plot_id THEN
    SELECT COUNT(*) INTO v_plot_count 
    FROM public.operations 
    WHERE plot_id IS NOT NULL;
    
    RAISE NOTICE 'plot_id (ancien) existe: % lignes', v_plot_count;
    RAISE NOTICE '⚠️  Cette colonne référençait l''ancienne table plots (supprimée)';
    
    IF v_plot_count > 0 THEN
      RAISE WARNING 'ATTENTION: % lignes avec plot_id seront perdues', v_plot_count;
    END IF;
  ELSE
    RAISE NOTICE '✓ Pas de plot_id - table propre';
  END IF;
END $$;

-- Supprimer la colonne plot_id obsolète
ALTER TABLE public.operations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ operations.plot_id supprimé (ancienne référence)';
  RAISE NOTICE 'ℹ️  Note: operations n''a plus de lien direct avec plots';
  RAISE NOTICE 'ℹ️  Les opérations sont liées via crops ou autres entités';
END $$;

-- ============================================================================
-- 4. TABLE OBSERVATIONS - SUPPRIMER ANCIEN PLOT_ID
-- ============================================================================

DO $$
DECLARE
  v_has_plot_id BOOLEAN;
  v_plot_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: OBSERVATIONS                   ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'observations'
      AND column_name = 'plot_id'
  ) INTO v_has_plot_id;
  
  IF v_has_plot_id THEN
    SELECT COUNT(*) INTO v_plot_count 
    FROM public.observations 
    WHERE plot_id IS NOT NULL;
    
    RAISE NOTICE 'plot_id (ancien) existe: % lignes', v_plot_count;
    
    IF v_plot_count > 0 THEN
      RAISE WARNING 'ATTENTION: % lignes avec plot_id seront perdues', v_plot_count;
    END IF;
  ELSE
    RAISE NOTICE '✓ Pas de plot_id - table propre';
  END IF;
END $$;

ALTER TABLE public.observations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ observations.plot_id supprimé (ancienne référence)';
END $$;

-- ============================================================================
-- 5. TABLE VISITS - SUPPRIMER ANCIEN PLOT_ID
-- ============================================================================

DO $$
DECLARE
  v_has_plot_id BOOLEAN;
  v_plot_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: VISITS                         ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'visits'
      AND column_name = 'plot_id'
  ) INTO v_has_plot_id;
  
  IF v_has_plot_id THEN
    SELECT COUNT(*) INTO v_plot_count 
    FROM public.visits 
    WHERE plot_id IS NOT NULL;
    
    RAISE NOTICE 'plot_id (ancien) existe: % lignes', v_plot_count;
    
    IF v_plot_count > 0 THEN
      RAISE WARNING 'ATTENTION: % lignes avec plot_id seront perdues', v_plot_count;
    END IF;
  ELSE
    RAISE NOTICE '✓ Pas de plot_id - table propre';
  END IF;
END $$;

ALTER TABLE public.visits 
  DROP COLUMN IF EXISTS plot_id CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ visits.plot_id supprimé (ancienne référence)';
END $$;

-- ============================================================================
-- 6. TABLE RECOMMENDATIONS - SUPPRIMER ANCIEN PLOT_ID
-- ============================================================================

DO $$
DECLARE
  v_has_plot_id BOOLEAN;
  v_plot_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: RECOMMENDATIONS                ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'recommendations'
      AND column_name = 'plot_id'
  ) INTO v_has_plot_id;
  
  IF v_has_plot_id THEN
    SELECT COUNT(*) INTO v_plot_count 
    FROM public.recommendations 
    WHERE plot_id IS NOT NULL;
    
    RAISE NOTICE 'plot_id (ancien) existe: % lignes', v_plot_count;
    
    IF v_plot_count > 0 THEN
      RAISE WARNING 'ATTENTION: % lignes avec plot_id seront perdues', v_plot_count;
    END IF;
  ELSE
    RAISE NOTICE '✓ Pas de plot_id - table propre';
  END IF;
END $$;

ALTER TABLE public.recommendations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ recommendations.plot_id supprimé (ancienne référence)';
END $$;

-- ============================================================================
-- 7. VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_crops_has_plot_id BOOLEAN;
  v_ops_has_plot_id BOOLEAN;
  v_obs_has_plot_id BOOLEAN;
  v_visits_has_plot_id BOOLEAN;
  v_recs_has_plot_id BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications post-migration:';
  RAISE NOTICE '========================================';
  
  -- Vérifier crops.plot_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'crops'
      AND column_name = 'plot_id'
  ) INTO v_crops_has_plot_id;
  
  IF v_crops_has_plot_id THEN
    RAISE NOTICE '✓ crops.plot_id existe (renommé depuis farm_file_plot_id)';
  ELSE
    RAISE WARNING '⚠️  crops.plot_id n''existe pas!';
  END IF;
  
  -- Vérifier que les anciennes colonnes plot_id sont supprimées
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'operations'
      AND column_name = 'plot_id'
  ) INTO v_ops_has_plot_id;
  
  IF NOT v_ops_has_plot_id THEN
    RAISE NOTICE '✓ operations.plot_id supprimé';
  ELSE
    RAISE WARNING '⚠️  operations.plot_id existe encore!';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'observations'
      AND column_name = 'plot_id'
  ) INTO v_obs_has_plot_id;
  
  IF NOT v_obs_has_plot_id THEN
    RAISE NOTICE '✓ observations.plot_id supprimé';
  ELSE
    RAISE WARNING '⚠️  observations.plot_id existe encore!';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'visits'
      AND column_name = 'plot_id'
  ) INTO v_visits_has_plot_id;
  
  IF NOT v_visits_has_plot_id THEN
    RAISE NOTICE '✓ visits.plot_id supprimé';
  ELSE
    RAISE WARNING '⚠️  visits.plot_id existe encore!';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'recommendations'
      AND column_name = 'plot_id'
  ) INTO v_recs_has_plot_id;
  
  IF NOT v_recs_has_plot_id THEN
    RAISE NOTICE '✓ recommendations.plot_id supprimé';
  ELSE
    RAISE WARNING '⚠️  recommendations.plot_id existe encore!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 8. RÉSUMÉ ET STATISTIQUES
-- ============================================================================

DO $$
DECLARE
  v_crops_count INTEGER;
  v_crops_with_plot INTEGER;
BEGIN
  -- Statistiques crops
  SELECT COUNT(*) INTO v_crops_count FROM public.crops;
  SELECT COUNT(*) INTO v_crops_with_plot FROM public.crops WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║         PHASE 4 TERMINÉE AVEC SUCCÈS                   ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Renommages effectués:';
  RAISE NOTICE '  ✓ crops.farm_file_plot_id → plot_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Suppressions effectuées:';
  RAISE NOTICE '  ✓ operations.plot_id (ancienne référence)';
  RAISE NOTICE '  ✓ observations.plot_id (ancienne référence)';
  RAISE NOTICE '  ✓ visits.plot_id (ancienne référence)';
  RAISE NOTICE '  ✓ recommendations.plot_id (ancienne référence)';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistiques crops:';
  RAISE NOTICE '  • Total cultures: %', v_crops_count;
  RAISE NOTICE '  • Avec plot_id: %', v_crops_with_plot;
  RAISE NOTICE '  • Contrainte FK ajoutée: crops_plot_id_fkey';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'État actuel:';
  RAISE NOTICE '  • Table plots opérationnelle ✓';
  RAISE NOTICE '  • crops.plot_id → plots.id (FK active) ✓';
  RAISE NOTICE '  • Anciennes références supprimées ✓';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '  Les tables operations, observations, visits,';
  RAISE NOTICE '  recommendations n''ont plus de lien direct';
  RAISE NOTICE '  avec plots. Vérifier la logique métier.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Prochaine étape: Phase 5 - Nettoyage';
  RAISE NOTICE '  → Supprimer plot_id_legacy de plots';
  RAISE NOTICE '  → Mettre à jour le frontend';
  RAISE NOTICE '========================================';
END $$;

