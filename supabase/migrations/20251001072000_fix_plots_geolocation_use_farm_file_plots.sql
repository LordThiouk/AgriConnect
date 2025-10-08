-- Migration: Correction pour utiliser UNIQUEMENT farm_file_plots (pas plots)
-- Objectif: La table plots est obsolète, farm_file_plots est la source de vérité

DROP FUNCTION IF EXISTS get_plots_with_geolocation_count(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION get_plots_with_geolocation_count(
  search_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  soil_type_param TEXT DEFAULT NULL,
  water_source_param TEXT DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM farm_file_plots ffp
    LEFT JOIN producers prod ON ffp.producer_id = prod.id
    WHERE 
      (search_param IS NULL OR ffp.name_season_snapshot ILIKE '%' || search_param || '%')
      AND (producer_id_param IS NULL OR ffp.producer_id = producer_id_param)
      AND (status_param IS NULL OR ffp.status = status_param)
      AND (soil_type_param IS NULL OR ffp.soil_type = soil_type_param)
      AND (water_source_param IS NULL OR ffp.water_source = water_source_param)
      AND (region_param IS NULL OR prod.region = region_param)
      AND (cooperative_id_param IS NULL OR prod.cooperative_id = cooperative_id_param)
  );
END;
$$;

DROP FUNCTION IF EXISTS get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_plots_with_geolocation(
  search_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  soil_type_param TEXT DEFAULT NULL,
  water_source_param TEXT DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL,
  page_param INTEGER DEFAULT 1,
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  farm_file_plot_id UUID,
  producer_id UUID,
  name TEXT,
  area_hectares NUMERIC,
  soil_type TEXT,
  soil_ph NUMERIC,
  water_source TEXT,
  irrigation_type TEXT,
  slope_percent INTEGER,
  elevation_meters INTEGER,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  geom GEOMETRY,
  center_point GEOMETRY,
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_region TEXT,
  producer_cooperative_id TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  offset_val := (page_param - 1) * limit_param;
  
  RETURN QUERY
  SELECT 
    ffp.id,
    ffp.id as farm_file_plot_id,
    ffp.producer_id,
    ffp.name_season_snapshot as name,
    ffp.area_hectares,
    ffp.soil_type,
    CASE 
      WHEN ffp.soil_ph IS NOT NULL THEN ffp.soil_ph::NUMERIC
      ELSE NULL::NUMERIC
    END as soil_ph,
    ffp.water_source,
    ffp.irrigation_type,
    ffp.slope_percent,
    ffp.elevation_meters,
    ffp.status,
    ffp.notes,
    ffp.created_at,
    ffp.updated_at,
    -- Extract coordinates from center_point or geom
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_Y(ffp.center_point::geometry)::NUMERIC
      WHEN ffp.geom IS NOT NULL THEN ST_Y(ST_Centroid(ffp.geom))::NUMERIC
      ELSE NULL::NUMERIC
    END as latitude,
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_X(ffp.center_point::geometry)::NUMERIC
      WHEN ffp.geom IS NOT NULL THEN ST_X(ST_Centroid(ffp.geom))::NUMERIC
      ELSE NULL::NUMERIC
    END as longitude,
    ffp.geom,
    ffp.center_point,
    prod.first_name as producer_first_name,
    prod.last_name as producer_last_name,
    prod.phone as producer_phone,
    prod.region as producer_region,
    prod.cooperative_id::TEXT as producer_cooperative_id
  FROM farm_file_plots ffp
  LEFT JOIN producers prod ON ffp.producer_id = prod.id
  WHERE 
    (search_param IS NULL OR ffp.name_season_snapshot ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR ffp.producer_id = producer_id_param)
    AND (status_param IS NULL OR ffp.status = status_param)
    AND (soil_type_param IS NULL OR ffp.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR ffp.water_source = water_source_param)
    AND (region_param IS NULL OR prod.region = region_param)
    AND (cooperative_id_param IS NULL OR prod.cooperative_id = cooperative_id_param)
  ORDER BY ffp.created_at DESC
  LIMIT limit_param OFFSET offset_val;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation_count(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_plots_with_geolocation_count(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) IS 'Compte les parcelles depuis farm_file_plots (source de vérité)';
COMMENT ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) IS 'Récupère les parcelles depuis farm_file_plots avec géolocalisation';

