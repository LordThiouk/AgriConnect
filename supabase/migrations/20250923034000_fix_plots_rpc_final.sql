-- Fix get_plots_with_geolocation final version
-- Remove cooperative filtering to avoid type conflicts

-- Drop existing function
DROP FUNCTION IF EXISTS get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) CASCADE;

-- Final working function
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
  id UUID,                           -- ID from plots table (for reference)
  farm_file_plot_id UUID,           -- ID from farm_file_plots table (for crops/operations)
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
  latitude NUMERIC,                  -- Center latitude
  longitude NUMERIC,                 -- Center longitude
  geom GEOMETRY,                     -- Full geometry
  center_point GEOMETRY,             -- Center point geometry
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_region TEXT,
  producer_cooperative_id UUID
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
    p.id,                           -- Keep original plot ID
    ffp.id as farm_file_plot_id,    -- Add farm_file_plot ID for crops/operations
    p.producer_id,
    p.name,
    ffp.area_hectares,
    ffp.soil_type,
    ffp.soil_ph,
    ffp.water_source,
    ffp.irrigation_type,
    ffp.slope_percent,
    ffp.elevation_meters,
    ffp.status,
    ffp.notes,
    p.created_at,
    p.updated_at,
    -- Extract coordinates from center_point or geom
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_Y(ffp.center_point::geometry)
      WHEN ffp.geom IS NOT NULL THEN ST_Y(ST_Centroid(ffp.geom))
      ELSE NULL
    END as latitude,
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_X(ffp.center_point::geometry)
      WHEN ffp.geom IS NOT NULL THEN ST_X(ST_Centroid(ffp.geom))
      ELSE NULL
    END as longitude,
    ffp.geom,
    ffp.center_point,
    pr.display_name as producer_first_name,  -- Use display_name from profiles
    NULL as producer_last_name,              -- No separate last_name in profiles
    pr.phone as producer_phone,
    pr.region as producer_region,
    NULL as producer_cooperative_id          -- Skip cooperative for now to avoid type issues
  FROM plots p
  JOIN farm_file_plots ffp ON p.id = ffp.plot_id
  LEFT JOIN profiles pr ON p.producer_id = pr.id
  WHERE 
    (search_param IS NULL OR 
     p.name ILIKE '%' || search_param || '%' OR 
     pr.display_name ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
    AND (status_param IS NULL OR ffp.status = status_param)
    AND (soil_type_param IS NULL OR ffp.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR ffp.water_source = water_source_param)
    AND (region_param IS NULL OR pr.region = region_param)
    -- Skip cooperative filtering for now
  ORDER BY p.created_at DESC
  LIMIT limit_param OFFSET offset_val;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) TO anon;

-- Add comment
COMMENT ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) IS 'Récupère les parcelles avec géolocalisation et farm_file_plot_id (version finale)';
