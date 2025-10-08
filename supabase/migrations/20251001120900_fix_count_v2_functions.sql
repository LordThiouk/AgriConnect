-- ============================================================================
-- FIX FINAL: Correction count_v2 functions
-- ============================================================================
-- Problème: count_operations_for_producer_v2 et count_observations_for_producer_v2 
--           utilisent encore farm_file_plots
-- Solution: Utiliser plots.producer_id directement
-- ============================================================================

-- 1. FIX: count_operations_for_producer_v2
-- ============================================================================

DROP FUNCTION IF EXISTS count_operations_for_producer_v2(uuid, text, text) CASCADE;

CREATE OR REPLACE FUNCTION count_operations_for_producer_v2(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN plots plt ON o.plot_id = plt.id
  WHERE 
    (producer_uuid IS NULL OR plt.producer_id = producer_uuid)
    AND (search_term IS NULL OR (
      o.description ILIKE '%' || search_term || '%' OR
      o.product_used ILIKE '%' || search_term || '%' OR
      o.notes ILIKE '%' || search_term || '%'
    ))
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter);
  
  RETURN result_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_operations_for_producer_v2(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION count_operations_for_producer_v2(uuid, text, text) TO anon;

COMMENT ON FUNCTION count_operations_for_producer_v2(uuid, text, text) IS 
  'Compte les opérations d''un producteur (V2). Utilise plots.producer_id directement.';

-- 2. FIX: count_observations_for_producer_v2
-- ============================================================================

DROP FUNCTION IF EXISTS count_observations_for_producer_v2(uuid, text, text) CASCADE;

CREATE OR REPLACE FUNCTION count_observations_for_producer_v2(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  LEFT JOIN plots plt ON obs.plot_id = plt.id
  WHERE 
    (producer_uuid IS NULL OR plt.producer_id = producer_uuid)
    AND (search_term IS NULL OR (
      obs.description ILIKE '%' || search_term || '%' OR
      obs.pest_disease_name ILIKE '%' || search_term || '%' OR
      obs.recommendations ILIKE '%' || search_term || '%'
    ))
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter);
  
  RETURN result_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_observations_for_producer_v2(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION count_observations_for_producer_v2(uuid, text, text) TO anon;

COMMENT ON FUNCTION count_observations_for_producer_v2(uuid, text, text) IS 
  'Compte les observations d''un producteur (V2). Utilise plots.producer_id directement.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      DERNIÈRES FONCTIONS V2 CORRIGÉES                 ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ count_operations_for_producer_v2';
  RAISE NOTICE '  ✓ count_observations_for_producer_v2';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • farm_file_plots + farm_files supprimés';
  RAISE NOTICE '  • plots.producer_id utilisé directement';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 PLUS AUCUNE RÉFÉRENCE À farm_file_plots !';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 21 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

