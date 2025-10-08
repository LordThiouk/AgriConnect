-- ============================================================================
-- FIX FINAL: Correction observer_id → observed_by et cleanup complet
-- ============================================================================
-- Problèmes détectés:
--   1. get_observations_with_details_v3 utilise observer_id au lieu de observed_by
--   2. Possibles fonctions RPC restantes utilisant farm_file_plots
-- ============================================================================

-- 1. FIX: get_observations_with_details_v3 - Correction colonne observed_by
-- ============================================================================

DROP FUNCTION IF EXISTS get_observations_with_details_v3(uuid, integer, integer, text, text) CASCADE;

CREATE OR REPLACE FUNCTION get_observations_with_details_v3(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  observation_date date,
  observation_type text,
  growth_stage text,
  health_status text,
  pest_disease_detected boolean,
  pest_disease_description text,
  severity_level text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  observed_by uuid,
  crop_type text,
  crop_variety text,
  plot_name text,
  observer_name text,
  observer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obs.id,
    obs.observation_date,
    obs.observation_type,
    obs.growth_stage,
    obs.health_status,
    obs.pest_disease_detected,
    obs.pest_disease_description,
    obs.severity AS severity_level,
    obs.description AS notes,
    obs.created_at,
    obs.updated_at,
    obs.crop_id,
    obs.plot_id,
    obs.observed_by,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(plt.name_season_snapshot, 'Parcelle inconnue') as plot_name,
    COALESCE(obsv.display_name, 'Agent inconnu') as observer_name,
    COALESCE(obsv.phone, 'N/A') as observer_phone
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  LEFT JOIN plots plt ON obs.plot_id = plt.id
  LEFT JOIN profiles obsv ON obs.observed_by = obsv.id
  LEFT JOIN producers prod ON plt.producer_id = prod.id
  WHERE 
    (producer_uuid IS NULL OR prod.id = producer_uuid)
    AND (search_term IS NULL OR 
         obs.description ILIKE '%' || search_term || '%' OR
         obs.pest_disease_description ILIKE '%' || search_term || '%' OR
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter)
  ORDER BY obs.observation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) TO anon;

COMMENT ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) IS 
  'Récupère les observations d''un producteur avec détails. Utilise observed_by et la table plots.';

-- 2. FIX: count_operations_for_producer (si elle existe)
-- ============================================================================

DROP FUNCTION IF EXISTS count_operations_for_producer(uuid, text, text) CASCADE;

CREATE OR REPLACE FUNCTION count_operations_for_producer(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
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
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN plots plt ON o.plot_id = plt.id
  LEFT JOIN producers prod ON plt.producer_id = prod.id
  WHERE 
    (producer_uuid IS NULL OR prod.id = producer_uuid)
    AND (search_term IS NULL OR 
         o.description ILIKE '%' || search_term || '%' OR
         o.product_used ILIKE '%' || search_term || '%' OR
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter);
  
  RETURN total_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_operations_for_producer(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION count_operations_for_producer(uuid, text, text) TO anon;

COMMENT ON FUNCTION count_operations_for_producer(uuid, text, text) IS 
  'Compte les opérations d''un producteur avec filtres. Utilise la table plots.';

-- 3. FIX: count_observations_for_producer (si elle existe)
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
         obs.pest_disease_description ILIKE '%' || search_term || '%' OR
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter);
  
  RETURN total_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_observations_for_producer(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION count_observations_for_producer(uuid, text, text) TO anon;

COMMENT ON FUNCTION count_observations_for_producer(uuid, text, text) IS 
  'Compte les observations d''un producteur avec filtres. Utilise la table plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      CORRECTION FINALE APPLIQUÉE                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Corrections appliquées:';
  RAISE NOTICE '  ✓ get_observations_with_details_v3: observer_id → observed_by';
  RAISE NOTICE '  ✓ count_operations_for_producer: créée/mise à jour';
  RAISE NOTICE '  ✓ count_observations_for_producer: créée/mise à jour';
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisation correcte des colonnes:';
  RAISE NOTICE '  • observations.observed_by (PAS observer_id)';
  RAISE NOTICE '  • plots (PAS farm_file_plots)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 16 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

