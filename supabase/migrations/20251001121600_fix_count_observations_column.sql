-- ============================================================================
-- FIX: Correction colonne dans count_observations_for_producer
-- ============================================================================
-- Problème: obs.pest_disease_description n'existe pas
-- Colonne réelle: obs.pest_disease_name
-- ============================================================================

DROP FUNCTION IF EXISTS count_observations_for_producer(uuid, text, text) CASCADE;

CREATE OR REPLACE FUNCTION count_observations_for_producer(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  LEFT JOIN plots plt ON obs.plot_id = plt.id
  LEFT JOIN producers prod ON plt.producer_id = prod.id
  WHERE 
    (producer_uuid IS NULL OR prod.id = producer_uuid)
    AND (search_term IS NULL OR 
         obs.description ILIKE '%' || search_term || '%' OR
         obs.pest_disease_name ILIKE '%' || search_term || '%' OR  -- CORRIGÉ
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter);
  
  RETURN total_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_observations_for_producer(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION count_observations_for_producer(uuid, text, text) TO anon;

COMMENT ON FUNCTION count_observations_for_producer(uuid, text, text) IS 
  'Compte les observations d''un producteur avec filtres. Utilise pest_disease_name (pas pest_disease_description).';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      COLONNE count_observations CORRIGÉE              ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Correction:';
  RAISE NOTICE '  ✓ pest_disease_description → pest_disease_name';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 28 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

