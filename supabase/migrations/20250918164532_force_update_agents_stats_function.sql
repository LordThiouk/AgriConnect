-- Force update agents stats function - completely rewrite it
-- This will ensure the function is properly updated

-- Drop the function completely
DROP FUNCTION IF EXISTS public.get_agents_stats() CASCADE;

-- Create a completely new, simple function
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
SECURITY DEFINER
AS $$
DECLARE
  visits_count bigint := 0;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO visits_count FROM public.visits WHERE status = 'completed';
  
  -- Return the results
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent') as total_agents,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true) as active_agents,
    (SELECT COUNT(DISTINCT producer_id) FROM public.agent_producer_assignments WHERE status = 'active') as total_producers,
    visits_count as total_visits,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true) > 0 THEN
        visits_count::numeric / (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true)
      ELSE 0::numeric
    END as avg_visits_per_agent,
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

-- Add comment
COMMENT ON FUNCTION public.get_agents_stats() IS 'Returns overall statistics for all agents - simplified version';
