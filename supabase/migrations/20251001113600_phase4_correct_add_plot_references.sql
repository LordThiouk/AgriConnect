-- ============================================================================
-- PHASE 4 CORRECTE: AJOUTER RÉFÉRENCES PLOT_ID VERS NOUVELLE TABLE PLOTS
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 20 minutes
-- Objectif: Mapper les tables vers la nouvelle table plots via plot_id_legacy
--
-- Stratégie:
-- - Utiliser plots.plot_id_legacy pour retrouver les correspondances
-- - Mapper vers plots.id (le vrai ID)
-- - Ajouter les contraintes FK
-- ============================================================================

-- ============================================================================
-- 1. TABLE OPERATIONS - MAPPER VERS PLOTS
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_plot_id INTEGER;
  v_mapped INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: OPERATIONS                     ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT COUNT(*) INTO v_total FROM public.operations;
  SELECT COUNT(*) INTO v_with_plot_id FROM public.operations WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE 'Total opérations: %', v_total;
  RAISE NOTICE 'Avec ancien plot_id: %', v_with_plot_id;
END $$;

-- Créer une colonne temporaire pour le nouveau plot_id
ALTER TABLE public.operations 
  ADD COLUMN IF NOT EXISTS plot_id_new UUID;

-- Mapper les anciennes références via plot_id_legacy
UPDATE public.operations o
SET plot_id_new = p.id
FROM public.plots p
WHERE o.plot_id = p.plot_id_legacy
  AND o.plot_id IS NOT NULL;

-- Afficher le résultat du mapping
DO $$
DECLARE
  v_mapped INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapped 
  FROM public.operations 
  WHERE plot_id_new IS NOT NULL;
  
  RAISE NOTICE '✓ Mappées vers nouvelle plots: % lignes', v_mapped;
END $$;

-- Supprimer l'ancienne colonne et renommer
ALTER TABLE public.operations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

ALTER TABLE public.operations 
  RENAME COLUMN plot_id_new TO plot_id;

-- Ajouter contrainte FK
ALTER TABLE public.operations
  ADD CONSTRAINT operations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ operations.plot_id → plots.id (FK ajoutée)';
END $$;

-- ============================================================================
-- 2. TABLE OBSERVATIONS - MAPPER VERS PLOTS
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_plot_id INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: OBSERVATIONS                   ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT COUNT(*) INTO v_total FROM public.observations;
  SELECT COUNT(*) INTO v_with_plot_id FROM public.observations WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE 'Total observations: %', v_total;
  RAISE NOTICE 'Avec ancien plot_id: %', v_with_plot_id;
END $$;

ALTER TABLE public.observations 
  ADD COLUMN IF NOT EXISTS plot_id_new UUID;

UPDATE public.observations o
SET plot_id_new = p.id
FROM public.plots p
WHERE o.plot_id = p.plot_id_legacy
  AND o.plot_id IS NOT NULL;

DO $$
DECLARE
  v_mapped INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapped 
  FROM public.observations 
  WHERE plot_id_new IS NOT NULL;
  
  RAISE NOTICE '✓ Mappées vers nouvelle plots: % lignes', v_mapped;
END $$;

ALTER TABLE public.observations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

ALTER TABLE public.observations 
  RENAME COLUMN plot_id_new TO plot_id;

ALTER TABLE public.observations
  ADD CONSTRAINT observations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ observations.plot_id → plots.id (FK ajoutée)';
END $$;

-- ============================================================================
-- 3. TABLE VISITS - MAPPER VERS PLOTS
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_plot_id INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: VISITS                         ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT COUNT(*) INTO v_total FROM public.visits;
  SELECT COUNT(*) INTO v_with_plot_id FROM public.visits WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE 'Total visites: %', v_total;
  RAISE NOTICE 'Avec ancien plot_id: %', v_with_plot_id;
END $$;

ALTER TABLE public.visits 
  ADD COLUMN IF NOT EXISTS plot_id_new UUID;

UPDATE public.visits v
SET plot_id_new = p.id
FROM public.plots p
WHERE v.plot_id = p.plot_id_legacy
  AND v.plot_id IS NOT NULL;

DO $$
DECLARE
  v_mapped INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapped 
  FROM public.visits 
  WHERE plot_id_new IS NOT NULL;
  
  RAISE NOTICE '✓ Mappées vers nouvelle plots: % lignes', v_mapped;
END $$;

ALTER TABLE public.visits 
  DROP COLUMN IF EXISTS plot_id CASCADE;

ALTER TABLE public.visits 
  RENAME COLUMN plot_id_new TO plot_id;

ALTER TABLE public.visits
  ADD CONSTRAINT visits_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ visits.plot_id → plots.id (FK ajoutée)';
END $$;

-- ============================================================================
-- 4. TABLE RECOMMENDATIONS - MAPPER VERS PLOTS
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_plot_id INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE: RECOMMENDATIONS                ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  
  SELECT COUNT(*) INTO v_total FROM public.recommendations;
  SELECT COUNT(*) INTO v_with_plot_id FROM public.recommendations WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE 'Total recommandations: %', v_total;
  RAISE NOTICE 'Avec ancien plot_id: %', v_with_plot_id;
END $$;

ALTER TABLE public.recommendations 
  ADD COLUMN IF NOT EXISTS plot_id_new UUID;

UPDATE public.recommendations r
SET plot_id_new = p.id
FROM public.plots p
WHERE r.plot_id = p.plot_id_legacy
  AND r.plot_id IS NOT NULL;

DO $$
DECLARE
  v_mapped INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapped 
  FROM public.recommendations 
  WHERE plot_id_new IS NOT NULL;
  
  RAISE NOTICE '✓ Mappées vers nouvelle plots: % lignes', v_mapped;
END $$;

ALTER TABLE public.recommendations 
  DROP COLUMN IF EXISTS plot_id CASCADE;

ALTER TABLE public.recommendations 
  RENAME COLUMN plot_id_new TO plot_id;

ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ recommendations.plot_id → plots.id (FK ajoutée)';
END $$;

-- ============================================================================
-- 5. VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
DECLARE
  v_crops_mapped INTEGER;
  v_ops_mapped INTEGER;
  v_obs_mapped INTEGER;
  v_visits_mapped INTEGER;
  v_recs_mapped INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications finales:';
  RAISE NOTICE '========================================';
  
  -- Compter les mappings réussis
  SELECT COUNT(*) INTO v_crops_mapped FROM public.crops WHERE plot_id IS NOT NULL;
  SELECT COUNT(*) INTO v_ops_mapped FROM public.operations WHERE plot_id IS NOT NULL;
  SELECT COUNT(*) INTO v_obs_mapped FROM public.observations WHERE plot_id IS NOT NULL;
  SELECT COUNT(*) INTO v_visits_mapped FROM public.visits WHERE plot_id IS NOT NULL;
  SELECT COUNT(*) INTO v_recs_mapped FROM public.recommendations WHERE plot_id IS NOT NULL;
  
  RAISE NOTICE 'crops avec plot_id: %', v_crops_mapped;
  RAISE NOTICE 'operations avec plot_id: %', v_ops_mapped;
  RAISE NOTICE 'observations avec plot_id: %', v_obs_mapped;
  RAISE NOTICE 'visits avec plot_id: %', v_visits_mapped;
  RAISE NOTICE 'recommendations avec plot_id: %', v_recs_mapped;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 6. RÉSUMÉ FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║    PHASE 4 CORRECTE TERMINÉE AVEC SUCCÈS               ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables maintenant liées à plots:';
  RAISE NOTICE '  ✓ crops.plot_id → plots.id';
  RAISE NOTICE '  ✓ operations.plot_id → plots.id';
  RAISE NOTICE '  ✓ observations.plot_id → plots.id';
  RAISE NOTICE '  ✓ visits.plot_id → plots.id';
  RAISE NOTICE '  ✓ recommendations.plot_id → plots.id';
  RAISE NOTICE '';
  RAISE NOTICE 'Toutes les contraintes FK ajoutées ✓';
  RAISE NOTICE 'Mapping via plot_id_legacy réussi ✓';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Prochaine étape: Phase 5 - Nettoyage';
  RAISE NOTICE '  → Supprimer plot_id_legacy';
  RAISE NOTICE '  → Mettre à jour le frontend';
  RAISE NOTICE '========================================';
END $$;

