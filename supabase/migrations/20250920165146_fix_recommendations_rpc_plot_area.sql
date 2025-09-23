-- Fix get_recommendations_with_details RPC to use farm_file_plots for area_hectares
-- The plots table doesn't have area_hectares, it's in farm_file_plots

DROP FUNCTION IF EXISTS get_recommendations_with_details(JSONB, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_recommendations_with_details(
  filters JSONB DEFAULT '{}'::jsonb,
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  crop_id UUID,
  plot_id UUID,
  producer_id UUID,
  rule_code TEXT,
  title TEXT,
  message TEXT,
  recommendation_type TEXT,
  priority TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Producer details
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_region TEXT,
  producer_cooperative_id UUID,
  producer_cooperative_name TEXT,
  -- Plot details
  plot_name TEXT,
  plot_area_hectares NUMERIC,
  plot_soil_type TEXT,
  plot_water_source TEXT,
  plot_status TEXT,
  -- Crop details
  crop_crop_type TEXT,
  crop_variety TEXT,
  crop_sowing_date DATE,
  crop_status TEXT,
  -- Pagination
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  total_count_val BIGINT;
BEGIN
  -- Calculate offset
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id');

  -- Return paginated results
  RETURN QUERY
  SELECT 
    r.id,
    r.crop_id,
    r.plot_id,
    r.producer_id,
    r.rule_code,
    r.title,
    r.message,
    r.recommendation_type,
    r.priority,
    r.status,
    r.sent_at,
    r.acknowledged_at,
    r.completed_at,
    r.created_at,
    r.updated_at,
    -- Producer details
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.phone as producer_phone,
    p.region as producer_region,
    p.cooperative_id as producer_cooperative_id,
    co.name as producer_cooperative_name,
    -- Plot details (using farm_file_plots for area_hectares)
    pl.name as plot_name,
    ffp.area_hectares as plot_area_hectares,
    ffp.soil_type as plot_soil_type,
    ffp.water_source as plot_water_source,
    pl.status as plot_status,
    -- Crop details
    c.crop_type as crop_crop_type,
    c.variety as crop_variety,
    c.sowing_date as crop_sowing_date,
    c.status as crop_status,
    -- Total count
    total_count_val as total_count
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN farm_file_plots ffp ON pl.id = ffp.plot_id  -- Join farm_file_plots for area_hectares
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id')
  ORDER BY r.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;
