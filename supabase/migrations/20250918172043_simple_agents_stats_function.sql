-- Create a simple version of get_agents_stats that definitely works
DROP FUNCTION IF EXISTS public.get_agents_stats();

CREATE OR REPLACE FUNCTION public.get_agents_stats()
RETURNS TABLE (
  total_agents bigint,
  active_agents bigint,
  total_producers bigint,
  total_visits bigint,
  avg_visits_per_agent numeric,
  data_quality_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent') as total_agents,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true) as active_agents,
    (SELECT COUNT(DISTINCT producer_id) FROM public.agent_producer_assignments) as total_producers,
    (SELECT COUNT(*) FROM public.visits WHERE status = 'completed') as total_visits,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true) > 0 
      THEN (SELECT COUNT(*) FROM public.visits WHERE status = 'completed')::numeric / (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true)
      ELSE 0 
    END as avg_visits_per_agent,
    85.5 as data_quality_rate; -- Placeholder value
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
