-- ============================================================================
-- FIX: Types latitude/longitude dans get_plots_with_geolocation
-- ============================================================================
-- Erreur: "Returned type double precision does not match expected type numeric in column 15"
-- Solution: Utiliser DOUBLE PRECISION au lieu de NUMERIC pour latitude et longitude
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_plots_with_geolocation(text, uuid, text, text, text, text, uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_plots_with_geolocation(
  search_param text DEFAULT NULL,
  producer_id_param uuid DEFAULT NULL,
  status_param text DEFAULT NULL,
  soil_type_param text DEFAULT NULL,
  water_source_param text DEFAULT NULL,
  region_param text DEFAULT NULL,
  cooperative_id_param uuid DEFAULT NULL,
  page_param integer DEFAULT 1,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  producer_id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  soil_ph numeric,
  water_source text,
  irrigation_type text,
  slope_percent integer,
  elevation_meters integer,
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  latitude double precision,  -- CHANGÉ: numeric → double precision
  longitude double precision, -- CHANGÉ: numeric → double precision
  geom jsonb,
  center_point jsonb,
  producer_first_name text,
  producer_last_name text,
  producer_phone text,
  producer_region text,
  producer_cooperative_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.producer_id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.soil_ph,
    p.water_source,
    p.irrigation_type,
    p.slope_percent,
    p.elevation_meters,
    p.status,
    p.notes,
    p.created_at,
    p.updated_at,
    ST_Y(p.center_point::geometry)::double precision AS latitude,
    ST_X(p.center_point::geometry)::double precision AS longitude,
    p.geom,
    ST_AsGeoJSON(p.center_point::geometry)::jsonb AS center_point,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name,
    pr.phone AS producer_phone,
    pr.region AS producer_region,
    pr.cooperative_id AS producer_cooperative_id
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE
    (search_param IS NULL OR p.name_season_snapshot ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
    AND (status_param IS NULL OR p.status = status_param)
    AND (soil_type_param IS NULL OR p.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR p.water_source = water_source_param)
    AND (region_param IS NULL OR pr.region = region_param)
    AND (cooperative_id_param IS NULL OR pr.cooperative_id = cooperative_id_param)
  ORDER BY p.created_at DESC
  OFFSET (page_param - 1) * limit_param
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_plots_with_geolocation IS 
  'Récupère les parcelles avec géolocalisation. Types corrigés: latitude/longitude en double precision.';

-- ============================================================================
-- FIX: get_agent_plots_with_geolocation
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_agent_plots_with_geolocation(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_plots_with_geolocation(p_agent_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  water_source text,
  status text,
  latitude double precision,  -- CHANGÉ: numeric → double precision
  longitude double precision, -- CHANGÉ: numeric → double precision
  producer_first_name text,
  producer_last_name text
) AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = p_agent_user_id;

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.water_source,
    p.status,
    ST_Y(p.center_point::geometry)::double precision AS latitude,
    ST_X(p.center_point::geometry)::double precision AS longitude,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE p.center_point IS NOT NULL
    AND p.producer_id IN (
      SELECT producer_id 
      FROM public.agent_assignments aa
      WHERE aa.agent_id = v_profile_id
        AND aa.assigned_to_type = 'producer'
    )
  ORDER BY p.name_season_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      TYPES RPC CORRIGÉS AVEC SUCCÈS                    ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions RPC corrigées:';
  RAISE NOTICE '  ✓ get_plots_with_geolocation (lat/lon: double precision)';
  RAISE NOTICE '  ✓ get_agent_plots_with_geolocation (lat/lon: double precision)';
  RAISE NOTICE '';
  RAISE NOTICE 'L''erreur 400 Bad Request devrait être résolue ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

