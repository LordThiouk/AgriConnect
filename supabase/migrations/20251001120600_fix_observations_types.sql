-- ============================================================================
-- FIX: Correction types emergence_percent et affected_area_percent
-- ============================================================================
-- Problème: Returned type integer does not match expected type numeric in column 4
-- La colonne 4 est emergence_percent
-- Solution: Changer numeric en integer pour les colonnes qui sont des entiers
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
  emergence_percent integer,
  pest_disease_name text,
  severity integer,
  affected_area_percent integer,
  description text,
  recommendations text,
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
    obs.emergence_percent::integer,
    obs.pest_disease_name,
    obs.severity,
    obs.affected_area_percent::integer,
    obs.description,
    obs.recommendations,
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
         obs.pest_disease_name ILIKE '%' || search_term || '%' OR
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
  'Récupère les observations d''un producteur avec détails. Types corrigés: emergence_percent et affected_area_percent en integer.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      TYPES OBSERVATIONS CORRIGÉS                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Corrections de types:';
  RAISE NOTICE '  ✓ emergence_percent: numeric → integer';
  RAISE NOTICE '  ✓ affected_area_percent: numeric → integer';
  RAISE NOTICE '  ✓ severity: integer (déjà correct)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 16 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

