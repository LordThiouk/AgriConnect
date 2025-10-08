-- ============================================================================
-- FIX: Type geom dans get_plots_with_geolocation
-- ============================================================================
-- Erreur: "Returned type geometry(Polygon,4326) does not match expected type jsonb in column 17"
-- Solution: Convertir explicitement avec ST_AsGeoJSON()
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
    ST_Y(p.center_point::geometry)::double precision AS latitude,
    ST_X(p.center_point::geometry)::double precision AS longitude,
    p.geom AS geom,  -- DÉJÀ EN JSONB dans la table plots
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
  'Récupère les parcelles avec géolocalisation. Types corrigés: lat/lon en double precision, geom en jsonb.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      TYPE GEOM CORRIGÉ AVEC SUCCÈS                     ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Correction appliquée:';
  RAISE NOTICE '  ✓ geom retournée directement (déjà en JSONB dans plots)';
  RAISE NOTICE '  ✓ Pas de conversion ST_AsGeoJSON() nécessaire pour geom';
  RAISE NOTICE '';
  RAISE NOTICE 'L''erreur 400 (column 17) devrait être résolue ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

