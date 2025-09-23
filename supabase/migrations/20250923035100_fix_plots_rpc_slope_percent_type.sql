-- Fix get_plots_with_geolocation with types matching TypeScript database types exactly
-- Based on web/src/types/database.ts:
-- - farm_file_plots: area_hectares (number), soil_ph (number | null), slope_percent (number | null), elevation_meters (number | null)
-- - plots: id (string), producer_id (string | null), name (string), created_at (string), updated_at (string)
-- - profiles: display_name (string | null), phone (string | null), region (string | null)
-- - PostGIS functions return DOUBLE PRECISION
-- CORRECTION: slope_percent et elevation_meters sont INTEGER dans la base, pas NUMERIC

DROP FUNCTION IF EXISTS get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) CASCADE;

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
  id UUID,                           -- plots.id (string in TS)
  farm_file_plot_id UUID,           -- farm_file_plots.id (string in TS)
  producer_id UUID,                  -- plots.producer_id (string | null in TS)
  name TEXT,                         -- plots.name (string in TS)
  area_hectares NUMERIC,             -- farm_file_plots.area_hectares (number in TS)
  soil_type TEXT,                    -- farm_file_plots.soil_type (string | null in TS)
  soil_ph NUMERIC,                   -- farm_file_plots.soil_ph (number | null in TS)
  water_source TEXT,                 -- farm_file_plots.water_source (string | null in TS)
  irrigation_type TEXT,              -- farm_file_plots.irrigation_type (string | null in TS)
  slope_percent INTEGER,             -- farm_file_plots.slope_percent (INTEGER in database, not NUMERIC!)
  elevation_meters INTEGER,          -- farm_file_plots.elevation_meters (INTEGER in database, not NUMERIC!)
  status TEXT,                       -- farm_file_plots.status (string | null in TS)
  notes TEXT,                        -- farm_file_plots.notes (string | null in TS)
  created_at TIMESTAMPTZ,            -- plots.created_at (string in TS)
  updated_at TIMESTAMPTZ,            -- plots.updated_at (string in TS)
  latitude DOUBLE PRECISION,         -- PostGIS ST_Y returns DOUBLE PRECISION
  longitude DOUBLE PRECISION,        -- PostGIS ST_X returns DOUBLE PRECISION
  geom GEOMETRY,                     -- farm_file_plots.geom (unknown | null in TS)
  center_point GEOMETRY,             -- farm_file_plots.center_point (unknown | null in TS)
  producer_first_name TEXT,          -- profiles.display_name (string | null in TS)
  producer_last_name TEXT,           -- Always NULL (no separate last_name)
  producer_phone TEXT,               -- profiles.phone (string | null in TS)
  producer_region TEXT,              -- profiles.region (string | null in TS)
  producer_cooperative_id UUID       -- Always NULL (skip cooperative for now)
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
    p.id,                           -- UUID from plots
    ffp.id as farm_file_plot_id,    -- UUID from farm_file_plots
    p.producer_id,                  -- UUID from plots
    p.name,                         -- TEXT from plots
    ffp.area_hectares,              -- NUMERIC from farm_file_plots
    ffp.soil_type,                  -- TEXT from farm_file_plots
    ffp.soil_ph,                    -- NUMERIC from farm_file_plots (can be NULL)
    ffp.water_source,               -- TEXT from farm_file_plots
    ffp.irrigation_type,            -- TEXT from farm_file_plots
    ffp.slope_percent,              -- INTEGER from farm_file_plots (not NUMERIC!)
    ffp.elevation_meters,           -- INTEGER from farm_file_plots (not NUMERIC!)
    ffp.status,                     -- TEXT from farm_file_plots
    ffp.notes,                      -- TEXT from farm_file_plots
    p.created_at,                   -- TIMESTAMPTZ from plots
    p.updated_at,                   -- TIMESTAMPTZ from plots
    -- PostGIS functions return DOUBLE PRECISION
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
    ffp.geom,                       -- GEOMETRY from farm_file_plots
    ffp.center_point,               -- GEOMETRY from farm_file_plots
    pr.display_name,                -- TEXT from profiles
    NULL::TEXT as producer_last_name,  -- Always NULL
    pr.phone,                       -- TEXT from profiles
    pr.region,                      -- TEXT from profiles (can be NULL)
    NULL::UUID as producer_cooperative_id  -- Always NULL for now
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
COMMENT ON FUNCTION get_plots_with_geolocation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) IS 'Récupère les parcelles avec géolocalisation et farm_file_plot_id (correction: slope_percent et elevation_meters INTEGER)';
