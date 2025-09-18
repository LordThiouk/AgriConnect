-- Fix the get_operations_with_details RPC function to use performer_id instead of performed_by
-- This migration corrects the column reference in the RPC function

-- Drop and recreate the function with the correct column name
DROP FUNCTION IF EXISTS get_operations_with_details(uuid, integer, integer, text, text);

CREATE OR REPLACE FUNCTION get_operations_with_details(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
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
  performer_id uuid,  -- ✅ Corrected column name
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_type text,
  plot_name text
)
LANGUAGE plpgsql
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
    o.performer_id,  -- ✅ Corrected column name
    o.notes,
    o.created_at,
    o.updated_at,
    c.crop_type,
    fp.plot_name
  FROM public.operations o
  LEFT JOIN public.crops c ON o.crop_id = c.id
  LEFT JOIN public.farm_file_plots fp ON o.plot_id = fp.id
  WHERE (producer_uuid IS NULL OR fp.producer_id = producer_uuid)
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
