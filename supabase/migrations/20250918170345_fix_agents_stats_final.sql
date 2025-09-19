-- Fix get_agents_stats function to handle missing status column properly
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
    (SELECT COUNT(DISTINCT producer_id) FROM public.agent_producer_assignments WHERE status = 'active') as total_producers,
    (SELECT COUNT(*) FROM public.visits) as total_visits, -- Simple count, no status filter
    COALESCE(
      (SELECT COUNT(*) FROM public.visits)::numeric /
      NULLIF((SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true), 0),
      0
    ) as avg_visits_per_agent,
    COALESCE(
      (SELECT AVG(
        CASE
          WHEN p.phone IS NOT NULL AND p.phone != '' THEN 1
          ELSE 0
        END
      ) FROM public.producers p) * 100,
      0
    ) as data_quality_rate;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
