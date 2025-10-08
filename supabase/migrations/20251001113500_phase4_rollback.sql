-- ============================================================================
-- ROLLBACK PHASE 4: Restaurer les colonnes supprimées
-- ============================================================================
-- Date: 2025-10-01
-- Objectif: Annuler les suppressions de plot_id pour permettre le re-mapping
--
-- Raison: Les tables operations, observations, visits, recommendations
-- DOIVENT être référencées avec la nouvelle table plots
-- ============================================================================

-- Restaurer plot_id dans operations
ALTER TABLE public.operations 
  ADD COLUMN IF NOT EXISTS plot_id UUID;

-- Restaurer plot_id dans observations  
ALTER TABLE public.observations 
  ADD COLUMN IF NOT EXISTS plot_id UUID;

-- Restaurer plot_id dans visits
ALTER TABLE public.visits 
  ADD COLUMN IF NOT EXISTS plot_id UUID;

-- Restaurer plot_id dans recommendations
ALTER TABLE public.recommendations 
  ADD COLUMN IF NOT EXISTS plot_id UUID;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROLLBACK PHASE 4 - Colonnes restaurées';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ operations.plot_id restauré';
  RAISE NOTICE '✓ observations.plot_id restauré';
  RAISE NOTICE '✓ visits.plot_id restauré';
  RAISE NOTICE '✓ recommendations.plot_id restauré';
  RAISE NOTICE '========================================';
END $$;

