-- ============================================================================
-- FIX DÉFINITIF: Conversion GEOMETRY → JSONB pour geom
-- ============================================================================
-- Erreur persistante: "Returned type geometry(Polygon,4326) does not match jsonb"
-- Cause: La colonne geom est RÉELLEMENT de type GEOMETRY dans la table
-- Solution: Conversion explicite avec ST_AsGeoJSON()::jsonb
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
  latitude double precision,
  longitude double precision,
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
    -- Latitude et longitude (NULL-safe)
    COALESCE(ST_Y(p.center_point), 0)::double precision AS latitude,
    COALESCE(ST_X(p.center_point), 0)::double precision AS longitude,
    -- geom: Conversion GEOMETRY → JSONB avec ST_AsGeoJSON()
    CASE 
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(p.geom)::jsonb
      ELSE NULL
    END AS geom,
    -- center_point: Conversion GEOMETRY → JSONB
    CASE 
      WHEN p.center_point IS NOT NULL THEN ST_AsGeoJSON(p.center_point)::jsonb
      ELSE NULL
    END AS center_point,
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
  'Récupère les parcelles avec géolocalisation. Convertit GEOMETRY → JSONB avec ST_AsGeoJSON().';

-- ============================================================================
-- MISE À JOUR: get_agent_plots_with_geolocation
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_agent_plots_with_geolocation(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_plots_with_geolocation(
  agent_id_param uuid
)
RETURNS TABLE (
  id uuid,
  producer_id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  water_source text,
  status text,
  created_at timestamptz,
  latitude double precision,
  longitude double precision,
  geom jsonb,
  center_point jsonb,
  producer_first_name text,
  producer_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.producer_id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.water_source,
    p.status,
    p.created_at,
    COALESCE(ST_Y(p.center_point), 0)::double precision AS latitude,
    COALESCE(ST_X(p.center_point), 0)::double precision AS longitude,
    CASE 
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(p.geom)::jsonb
      ELSE NULL
    END AS geom,
    CASE 
      WHEN p.center_point IS NOT NULL THEN ST_AsGeoJSON(p.center_point)::jsonb
      ELSE NULL
    END AS center_point,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE pr.agent_id = agent_id_param
  ORDER BY p.created_at DESC;
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
  RAISE NOTICE '║      CONVERSION GEOMETRY → JSONB APPLIQUÉE            ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ get_plots_with_geolocation';
  RAISE NOTICE '  ✓ get_agent_plots_with_geolocation';
  RAISE NOTICE '';
  RAISE NOTICE 'Conversions appliquées:';
  RAISE NOTICE '  • geom: ST_AsGeoJSON(p.geom)::jsonb';
  RAISE NOTICE '  • center_point: ST_AsGeoJSON(p.center_point)::jsonb';
  RAISE NOTICE '  • lat/lon: COALESCE pour NULL-safety';
  RAISE NOTICE '';
  RAISE NOTICE 'L''erreur devrait être résolue définitivement ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

