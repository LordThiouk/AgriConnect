-- Simplify agent producers function
-- This will provide a working version

-- Drop the function completely
DROP FUNCTION IF EXISTS public.get_agent_producers(uuid) CASCADE;

-- Create a simplified version
CREATE OR REPLACE FUNCTION public.get_agent_producers(agent_id uuid)
RETURNS TABLE (
  producer_id uuid,
  producer_name text,
  phone text,
  region text,
  department text,
  commune text,
  total_plots bigint,
  last_visit_date timestamptz,
  assignment_date timestamptz,
  total_visits bigint,
  next_visit_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as producer_id,
    CONCAT(p.first_name, ' ', p.last_name) as producer_name,
    COALESCE(p.phone, '') as phone,
    COALESCE(p.region, '') as region,
    COALESCE(p.department, '') as department,
    COALESCE(p.commune, '') as commune,
    (SELECT COUNT(*) FROM public.farm_file_plots fp WHERE fp.producer_id = p.id) as total_plots,
    (SELECT MAX(v.visit_date) 
     FROM public.visits v 
     WHERE v.producer_id = p.id AND v.status = 'completed') as last_visit_date,
    apa.assigned_at as assignment_date,
    (SELECT COUNT(*) 
     FROM public.visits v 
     WHERE v.producer_id = p.id AND v.status = 'completed') as total_visits,
    (SELECT MIN(v.visit_date) 
     FROM public.visits v 
     WHERE v.producer_id = p.id AND v.status = 'scheduled' AND v.visit_date > now()) as next_visit_date
  FROM public.producers p
  JOIN public.agent_producer_assignments apa ON p.id = apa.producer_id
  WHERE apa.agent_id = get_agent_producers.agent_id AND apa.status = 'active'
  ORDER BY apa.assigned_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agent_producers(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_agent_producers(uuid) IS 'Returns list of producers assigned to a specific agent - simplified version';
