-- Add agent information to observations and operations RPC functions
-- This will include agent name and phone number instead of just the ID

-- Drop existing functions to recreate with agent info
DROP FUNCTION IF EXISTS get_observations_with_details_v2(uuid, integer, integer, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_operations_with_details_v2(uuid, integer, integer, text, text) CASCADE;

-- Function to get observations with crop, plot and AGENT information (V3 - WITH AGENT INFO)
CREATE OR REPLACE FUNCTION get_observations_with_details_v3(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  observation_type text,
  observation_date date,
  emergence_percent integer,
  pest_disease_name text,
  severity integer,
  affected_area_percent decimal,
  description text,
  recommendations text,
  observed_by uuid,
  agent_name text,
  agent_phone text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  crop_type text,
  crop_variety text,
  plot_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obs.id,
    obs.observation_type,
    obs.observation_date,
    obs.emergence_percent,
    obs.pest_disease_name,
    obs.severity,
    obs.affected_area_percent,
    obs.description,
    obs.recommendations,
    obs.observed_by,
    COALESCE(p.first_name || ' ' || p.last_name, 'Agent inconnu') as agent_name,
    COALESCE(p.phone, 'N/A') as agent_phone,
    obs.created_at,
    obs.updated_at,
    obs.crop_id,
    obs.plot_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(ffp.name_season_snapshot, 'Parcelle inconnue') as plot_name
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  LEFT JOIN farm_file_plots ffp ON obs.plot_id = ffp.id
  LEFT JOIN profiles p ON obs.observed_by = p.id  -- JOIN avec profiles pour récupérer les infos agent
  WHERE 
    (producer_uuid IS NULL OR obs.plot_id IN (
      SELECT fp.id 
      FROM farm_file_plots fp
      JOIN farm_files ff ON fp.farm_file_id = ff.id
      WHERE ff.responsible_producer_id = producer_uuid
    ))
    AND (search_term IS NULL OR (
      obs.description ILIKE '%' || search_term || '%' OR
      obs.pest_disease_name ILIKE '%' || search_term || '%' OR
      obs.recommendations ILIKE '%' || search_term || '%'
    ))
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter)
  ORDER BY obs.observation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to get operations with crop, plot and AGENT information (V3 - WITH AGENT INFO)
CREATE OR REPLACE FUNCTION get_operations_with_details_v3(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  operation_type text,
  operation_date date,
  description text,
  product_used text,
  dose_per_hectare decimal,
  total_dose decimal,
  unit text,
  cost_per_hectare decimal,
  total_cost decimal,
  performer_id uuid,
  performer_name text,
  performer_phone text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  crop_type text,
  crop_variety text,
  plot_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.operation_type,
    o.operation_date,
    o.description,
    o.product_used,
    o.dose_per_hectare,
    o.total_dose,
    o.unit,
    o.cost_per_hectare,
    o.total_cost,
    o.performer_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Agent inconnu') as performer_name,
    COALESCE(p.phone, 'N/A') as performer_phone,
    o.notes,
    o.created_at,
    o.updated_at,
    o.crop_id,
    o.plot_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(ffp.name_season_snapshot, 'Parcelle inconnue') as plot_name
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN farm_file_plots ffp ON o.plot_id = ffp.id
  LEFT JOIN profiles p ON o.performer_id = p.id  -- JOIN avec profiles pour récupérer les infos agent
  WHERE 
    (producer_uuid IS NULL OR o.plot_id IN (
      SELECT fp.id 
      FROM farm_file_plots fp
      JOIN farm_files ff ON fp.farm_file_id = ff.id
      WHERE ff.responsible_producer_id = producer_uuid
    ))
    AND (search_term IS NULL OR (
      o.description ILIKE '%' || search_term || '%' OR
      o.product_used ILIKE '%' || search_term || '%' OR
      o.notes ILIKE '%' || search_term || '%'
    ))
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter)
  ORDER BY o.operation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to count observations for a producer (V3)
CREATE OR REPLACE FUNCTION count_observations_for_producer_v3(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  WHERE 
    (producer_uuid IS NULL OR obs.plot_id IN (
      SELECT fp.id 
      FROM farm_file_plots fp
      JOIN farm_files ff ON fp.farm_file_id = ff.id
      WHERE ff.responsible_producer_id = producer_uuid
    ))
    AND (search_term IS NULL OR (
      obs.description ILIKE '%' || search_term || '%' OR
      obs.pest_disease_name ILIKE '%' || search_term || '%' OR
      obs.recommendations ILIKE '%' || search_term || '%'
    ))
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter);
  
  RETURN result_count;
END;
$$;

-- Function to count operations for a producer (V3)
CREATE OR REPLACE FUNCTION count_operations_for_producer_v3(
  producer_uuid uuid DEFAULT NULL,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  WHERE 
    (producer_uuid IS NULL OR o.plot_id IN (
      SELECT fp.id 
      FROM farm_file_plots fp
      JOIN farm_files ff ON fp.farm_file_id = ff.id
      WHERE ff.responsible_producer_id = producer_uuid
    ))
    AND (search_term IS NULL OR (
      o.description ILIKE '%' || search_term || '%' OR
      o.product_used ILIKE '%' || search_term || '%' OR
      o.notes ILIKE '%' || search_term || '%'
    ))
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter);
  
  RETURN result_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_observations_with_details_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION get_operations_with_details_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION count_observations_for_producer_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION count_operations_for_producer_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION get_observations_with_details_v3 TO anon;
GRANT EXECUTE ON FUNCTION get_operations_with_details_v3 TO anon;
GRANT EXECUTE ON FUNCTION count_observations_for_producer_v3 TO anon;
GRANT EXECUTE ON FUNCTION count_operations_for_producer_v3 TO anon;

-- Add comments
COMMENT ON FUNCTION get_observations_with_details_v3 IS 'Récupère les observations avec détails des cultures, parcelles et informations agent (V3)';
COMMENT ON FUNCTION get_operations_with_details_v3 IS 'Récupère les opérations avec détails des cultures, parcelles et informations agent (V3)';
