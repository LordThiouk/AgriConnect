-- Fix get_agent_assignments to return all fields needed for display
DROP FUNCTION IF EXISTS get_agent_assignments(uuid);

CREATE OR REPLACE FUNCTION get_agent_assignments(p_agent_id uuid)
RETURNS TABLE(
  id uuid,
  assigned_to_type text,
  assigned_to_id uuid,
  assigned_at timestamptz,
  assigned_by uuid,
  assigned_to_name text,
  assigned_by_name text,
  -- Additional fields for display
  name text,
  display_name text,
  first_name text,
  last_name text,
  phone text,
  region text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.assigned_to_type,
        aa.assigned_to_id,
        aa.assigned_at,
        aa.assigned_by,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                CONCAT(p.first_name, ' ', p.last_name)
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.name
            ELSE 'Inconnu'
        END as assigned_to_name,
        CASE 
            WHEN aa.assigned_by IS NOT NULL THEN 
                pb.display_name
            ELSE NULL
        END as assigned_by_name,
        -- Additional fields for display
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                CONCAT(p.first_name, ' ', p.last_name)
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.name
            ELSE NULL
        END as name,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                CONCAT(p.first_name, ' ', p.last_name)
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.name
            ELSE NULL
        END as display_name,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                p.first_name
            ELSE NULL
        END as first_name,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                p.last_name
            ELSE NULL
        END as last_name,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                p.phone
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.phone
            ELSE NULL
        END as phone,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                p.region
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.region
            ELSE NULL
        END as region
    FROM public.agent_assignments aa
    LEFT JOIN public.producers p ON aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p.id
    LEFT JOIN public.cooperatives c ON aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id
    LEFT JOIN public.profiles pb ON aa.assigned_by = pb.id
    WHERE aa.agent_id = p_agent_id
    ORDER BY aa.assigned_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_agent_assignments(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_agent_assignments(uuid) IS 'Returns agent assignments with all display fields for frontend';
