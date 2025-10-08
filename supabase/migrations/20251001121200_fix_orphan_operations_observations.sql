-- ============================================================================
-- FIX: Reconnecter les opérations et observations orphelines
-- ============================================================================
-- Problème: 10 opérations et 4 observations ont plot_id = NULL
-- Cause: Phase 4 rollback/correction a déconnecté les données
-- Solution: Relier via crop_id → crops.plot_id
-- ============================================================================

-- 1. Analyser les opérations orphelines
DO $$
DECLARE
  orphan_ops_count INTEGER;
  orphan_obs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_ops_count FROM operations WHERE plot_id IS NULL;
  SELECT COUNT(*) INTO orphan_obs_count FROM observations WHERE plot_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Opérations orphelines: %', orphan_ops_count;
  RAISE NOTICE '🔍 Observations orphelines: %', orphan_obs_count;
  RAISE NOTICE '';
END $$;

-- 2. Reconnecter les opérations via crop_id
UPDATE operations o
SET plot_id = c.plot_id
FROM crops c
WHERE o.crop_id = c.id
  AND o.plot_id IS NULL
  AND c.plot_id IS NOT NULL;

-- 3. Reconnecter les observations via crop_id
UPDATE observations obs
SET plot_id = c.plot_id
FROM crops c
WHERE obs.crop_id = c.id
  AND obs.plot_id IS NULL
  AND c.plot_id IS NOT NULL;

-- 4. Vérifier le résultat
DO $$
DECLARE
  ops_fixed INTEGER;
  obs_fixed INTEGER;
  orphan_ops_remaining INTEGER;
  orphan_obs_remaining INTEGER;
BEGIN
  -- Compter ce qui a été fixé
  GET DIAGNOSTICS ops_fixed = ROW_COUNT;
  
  -- Vérifier ce qui reste
  SELECT COUNT(*) INTO orphan_ops_remaining FROM operations WHERE plot_id IS NULL;
  SELECT COUNT(*) INTO orphan_obs_remaining FROM observations WHERE plot_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      OPÉRATIONS/OBSERVATIONS RECONNECTÉES             ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultats:';
  RAISE NOTICE '  ✓ Opérations orphelines restantes: %', orphan_ops_remaining;
  RAISE NOTICE '  ✓ Observations orphelines restantes: %', orphan_obs_remaining;
  RAISE NOTICE '';
  
  IF orphan_ops_remaining = 0 AND orphan_obs_remaining = 0 THEN
    RAISE NOTICE '✅ Toutes les données ont été reconnectées !';
  ELSE
    RAISE NOTICE '⚠️  Certaines données restent orphelines (crop_id NULL ou crop sans plot)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

