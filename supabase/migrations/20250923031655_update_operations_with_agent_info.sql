-- Update get_operations_with_details to include agent information
-- This function is used by OperationsService.getOperations and getOperationsByPlot

-- Drop existing function to recreate with agent info
DROP FUNCTION IF EXISTS get_operations_with_details(uuid, uuid, text, text, text, integer, integer) CASCADE;

-- Function to get operations with crop, plot and AGENT information (UPDATED)
CREATE OR REPLACE FUNCTION get_operations_with_details(
  plot_uuid uuid DEFAULT NULL,
  crop_uuid uuid DEFAULT NULL,
  operation_type_filter text DEFAULT NULL,
  date_from text DEFAULT NULL,
  date_to text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
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
    COALESCE(p.display_name, 'Agent inconnu') as performer_name,
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
    (plot_uuid IS NULL OR o.plot_id = plot_uuid)
    AND (crop_uuid IS NULL OR o.crop_id = crop_uuid)
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter)
    AND (date_from IS NULL OR o.operation_date >= date_from::date)
    AND (date_to IS NULL OR o.operation_date <= date_to::date)
  ORDER BY o.operation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) TO anon;

-- Add comment
COMMENT ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) IS 'Récupère les opérations avec détails des cultures, parcelles et informations agent (UPDATED)';
