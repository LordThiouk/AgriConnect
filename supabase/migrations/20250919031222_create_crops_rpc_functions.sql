-- RPC functions for crops management

-- Get crops with plot information
CREATE OR REPLACE FUNCTION get_crops_with_plot_info(
  plot_id_param UUID DEFAULT NULL,
  search_param TEXT DEFAULT NULL,
  crop_type_param TEXT DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  season_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL,
  page_param INTEGER DEFAULT 1,
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  crop_type TEXT,
  variety TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  expected_yield_kg NUMERIC,
  actual_yield_kg NUMERIC,
  area_hectares NUMERIC,
  status TEXT,
  notes TEXT,
  season_id UUID,
  farm_file_plot_id UUID,
  plot_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plot_name TEXT,
  plot_producer_id UUID,
  operations_count BIGINT
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
    c.id,
    c.crop_type,
    c.variety,
    c.sowing_date,
    c.expected_harvest_date,
    c.actual_harvest_date,
    c.expected_yield_kg,
    c.actual_yield_kg,
    c.area_hectares,
    c.status,
    c.notes,
    c.season_id,
    c.farm_file_plot_id,
    c.plot_id,
    c.created_at,
    c.updated_at,
    ffp.name_season_snapshot as plot_name,
    ffp.producer_id as plot_producer_id,
    COUNT(o.id) as operations_count
  FROM crops c
  LEFT JOIN farm_file_plots ffp ON c.farm_file_plot_id = ffp.id
  LEFT JOIN operations o ON c.id = o.crop_id
  LEFT JOIN seasons s ON c.season_id = s.id
  LEFT JOIN profiles p ON ffp.producer_id = p.id
  WHERE 
    (plot_id_param IS NULL OR c.plot_id = plot_id_param)
    AND (search_param IS NULL OR 
         c.crop_type ILIKE '%' || search_param || '%' OR 
         c.variety ILIKE '%' || search_param || '%' OR 
         c.notes ILIKE '%' || search_param || '%')
    AND (crop_type_param IS NULL OR c.crop_type = crop_type_param)
    AND (status_param IS NULL OR c.status = status_param)
    AND (season_param IS NULL OR s.label = season_param)
    AND (producer_id_param IS NULL OR ffp.producer_id = producer_id_param)
    AND (region_param IS NULL OR p.region = region_param)
    AND (cooperative_id_param IS NULL OR ffp.cooperative_id = cooperative_id_param)
  GROUP BY c.id, ffp.name_season_snapshot, ffp.producer_id
  ORDER BY c.sowing_date DESC
  LIMIT limit_param OFFSET offset_val;
END;
$$;

-- Get crop by ID with plot information
CREATE OR REPLACE FUNCTION get_crop_by_id_with_plot_info(crop_id_param UUID)
RETURNS TABLE (
  id UUID,
  crop_type TEXT,
  variety TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  expected_yield_kg NUMERIC,
  actual_yield_kg NUMERIC,
  area_hectares NUMERIC,
  status TEXT,
  notes TEXT,
  season_id UUID,
  farm_file_plot_id UUID,
  plot_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plot_name TEXT,
  plot_producer_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.crop_type,
    c.variety,
    c.sowing_date,
    c.expected_harvest_date,
    c.actual_harvest_date,
    c.expected_yield_kg,
    c.actual_yield_kg,
    c.area_hectares,
    c.status,
    c.notes,
    c.season_id,
    c.farm_file_plot_id,
    c.plot_id,
    c.created_at,
    c.updated_at,
    ffp.name_season_snapshot as plot_name,
    ffp.producer_id as plot_producer_id
  FROM crops c
  LEFT JOIN farm_file_plots ffp ON c.farm_file_plot_id = ffp.id
  WHERE c.id = crop_id_param;
END;
$$;

-- Get crops count for pagination
CREATE OR REPLACE FUNCTION get_crops_count(
  plot_id_param UUID DEFAULT NULL,
  search_param TEXT DEFAULT NULL,
  crop_type_param TEXT DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  season_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM crops c
  LEFT JOIN farm_file_plots ffp ON c.farm_file_plot_id = ffp.id
  LEFT JOIN seasons s ON c.season_id = s.id
  LEFT JOIN profiles p ON ffp.producer_id = p.id
  WHERE 
    (plot_id_param IS NULL OR c.plot_id = plot_id_param)
    AND (search_param IS NULL OR 
         c.crop_type ILIKE '%' || search_param || '%' OR 
         c.variety ILIKE '%' || search_param || '%' OR 
         c.notes ILIKE '%' || search_param || '%')
    AND (crop_type_param IS NULL OR c.crop_type = crop_type_param)
    AND (status_param IS NULL OR c.status = status_param)
    AND (season_param IS NULL OR s.label = season_param)
    AND (producer_id_param IS NULL OR ffp.producer_id = producer_id_param)
    AND (region_param IS NULL OR p.region = region_param)
    AND (cooperative_id_param IS NULL OR ffp.cooperative_id = cooperative_id_param);
    
  RETURN count_result;
END;
$$;
