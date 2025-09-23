-- Fix operations RPC functions with correct column names and structure
-- This replaces the previous broken functions with corrected versions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_operations_with_details(uuid, uuid, text, date, date, integer, integer);
DROP FUNCTION IF EXISTS count_operations_for_filters(uuid, uuid, text, date, date);

-- Create corrected RPC function for operations with plot and crop filtering
CREATE OR REPLACE FUNCTION get_operations_with_details(
  plot_uuid uuid DEFAULT NULL,
  crop_uuid uuid DEFAULT NULL,
  operation_type_filter text DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  crop_id uuid,
  plot_id uuid,
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
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  -- Related data
  crop_type text,
  crop_variety text,
  plot_name text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.crop_id,
    o.plot_id,
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
    o.notes,
    o.created_at,
    o.updated_at,
    -- Related data
    c.crop_type,
    c.variety as crop_variety,
    ffp.name_season_snapshot as plot_name
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN farm_file_plots ffp ON o.plot_id = ffp.id
  WHERE 
    -- Apply filters
    (plot_uuid IS NULL OR o.plot_id = plot_uuid) AND
    (crop_uuid IS NULL OR o.crop_id = crop_uuid) AND
    (operation_type_filter IS NULL OR o.operation_type = operation_type_filter) AND
    (date_from IS NULL OR o.operation_date >= date_from) AND
    (date_to IS NULL OR o.operation_date <= date_to)
  ORDER BY o.operation_date DESC, o.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- Function to count operations with the same filters
CREATE OR REPLACE FUNCTION count_operations_for_filters(
  plot_uuid uuid DEFAULT NULL,
  crop_uuid uuid DEFAULT NULL,
  operation_type_filter text DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM operations o
    WHERE 
      (plot_uuid IS NULL OR o.plot_id = plot_uuid) AND
      (crop_uuid IS NULL OR o.crop_id = crop_uuid) AND
      (operation_type_filter IS NULL OR o.operation_type = operation_type_filter) AND
      (date_from IS NULL OR o.operation_date >= date_from) AND
      (date_to IS NULL OR o.operation_date <= date_to)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, date, date, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, date, date, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION count_operations_for_filters(uuid, uuid, text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION count_operations_for_filters(uuid, uuid, text, date, date) TO anon;

-- Add comments
COMMENT ON FUNCTION get_operations_with_details(uuid, uuid, text, date, date, integer, integer) IS 'Récupère les opérations agricoles avec détails par parcelle, culture ou type (version corrigée)';
COMMENT ON FUNCTION count_operations_for_filters(uuid, uuid, text, date, date) IS 'Compte les opérations agricoles selon les filtres (version corrigée)';
