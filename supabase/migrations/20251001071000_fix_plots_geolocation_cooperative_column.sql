-- Migration: Correction des fonctions get_plots_with_geolocation pour retirer pr.cooperative
-- Objectif: Remplacer pr.cooperative par pr.cooperative_id depuis la table producers

-- Drop and recreate get_plots_with_geolocation_count
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
    FROM plots p
    LEFT JOIN farm_file_plots ffp ON p.id = ffp.plot_id
    LEFT JOIN producers prod ON p.producer_id = prod.id
    WHERE 
      (search_param IS NULL OR p.name ILIKE '%' || search_param || '%')
      AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
      AND (status_param IS NULL OR ffp.status = status_param)
      AND (soil_type_param IS NULL OR ffp.soil_type = soil_type_param)
      AND (water_source_param IS NULL OR ffp.water_source = water_source_param)
      AND (region_param IS NULL OR prod.region = region_param)
      AND (cooperative_id_param IS NULL OR prod.cooperative_id = cooperative_id_param)
  );
END;
$$;

-- Drop and recreate get_plots_with_geolocation
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
  producer_id UUID,
  name TEXT,
  area_hectares NUMERIC,
  soil_type TEXT,
  soil_ph NUMERIC,
  water_source TEXT,
  irrigation_type TEXT,
  slope_percent NUMERIC,
  elevation_meters NUMERIC,
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
    p.id,
    p.producer_id,
    p.name,
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
    p.created_at,
    p.updated_at,
    -- Extract coordinates from center_point or geom with proper casting
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_Y(ffp.center_point)::NUMERIC
      WHEN ffp.geom IS NOT NULL THEN ST_Y(ST_Centroid(ffp.geom))::NUMERIC
      ELSE NULL::NUMERIC
    END as latitude,
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_X(ffp.center_point)::NUMERIC
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
  FROM plots p
  LEFT JOIN farm_file_plots ffp ON p.id = ffp.plot_id
  LEFT JOIN producers prod ON p.producer_id = prod.id
  WHERE 
    (search_param IS NULL OR p.name ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
    AND (status_param IS NULL OR ffp.status = status_param)
    AND (soil_type_param IS NULL OR ffp.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR ffp.water_source = water_source_param)
    AND (region_param IS NULL OR prod.region = region_param)
    AND (cooperative_id_param IS NULL OR prod.cooperative_id = cooperative_id_param)
  ORDER BY p.created_at DESC
  LIMIT limit_param OFFSET offset_val;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation_count(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_plots_with_geolocation_count(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) IS 'Compte le nombre de parcelles avec filtres (corrigé pour utiliser producers.cooperative_id)';
COMMENT ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) IS 'Récupère les parcelles avec géolocalisation et filtres (corrigé pour utiliser producers.cooperative_id)';

