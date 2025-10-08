-- ============================================================================
-- RECONNEXION: Visites → Parcelles via producer_id
-- ============================================================================
-- Problème: Toutes les visites ont plot_id = NULL
-- Solution: Assigner plot_id depuis plots via producer_id
-- Stratégie: Si plusieurs parcelles, prendre la plus récente
-- ============================================================================

-- 1. Analyser les visites orphelines
DO $$
DECLARE
  orphan_visits_count INTEGER;
  total_visits_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_visits_count FROM visits WHERE plot_id IS NULL;
  SELECT COUNT(*) INTO total_visits_count FROM visits;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Visites orphelines: % / %', orphan_visits_count, total_visits_count;
  RAISE NOTICE '';
END $$;

-- 2. Reconnecter les visites aux parcelles
-- Si plusieurs parcelles pour un producteur, prendre la plus récente
UPDATE visits v
SET plot_id = (
  SELECT p.id
  FROM plots p
  WHERE p.producer_id = v.producer_id
  ORDER BY p.created_at DESC
  LIMIT 1
)
WHERE v.plot_id IS NULL
  AND v.producer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM plots p WHERE p.producer_id = v.producer_id
  );

-- 3. Vérifier le résultat
DO $$
DECLARE
  reconnected_count INTEGER;
  orphan_remaining INTEGER;
  total_count INTEGER;
BEGIN
  -- Compter total
  SELECT COUNT(*) INTO total_count FROM visits;
  
  -- Compter reconnectées
  SELECT COUNT(*) INTO reconnected_count 
  FROM visits 
  WHERE plot_id IS NOT NULL;
  
  -- Compter orphelines restantes
  SELECT COUNT(*) INTO orphan_remaining 
  FROM visits 
  WHERE plot_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      VISITES RECONNECTÉES AUX PARCELLES               ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultats:';
  RAISE NOTICE '  ✓ Total visites: %', total_count;
  RAISE NOTICE '  ✓ Visites avec plot_id: %', reconnected_count;
  RAISE NOTICE '  ✓ Visites orphelines: %', orphan_remaining;
  RAISE NOTICE '';
  
  IF orphan_remaining = 0 THEN
    RAISE NOTICE '✅ Toutes les visites reconnectées !';
  ELSIF orphan_remaining > 0 AND orphan_remaining < total_count THEN
    RAISE NOTICE '⚠️  % visites restent orphelines (producer sans parcelle)', orphan_remaining;
  ELSE
    RAISE NOTICE '❌ Aucune visite reconnectée - vérifier les données';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

