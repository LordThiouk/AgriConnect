-- Final version of get_agents_stats function
-- This version properly handles all the tables and relationships

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
DECLARE
  v_total_agents bigint;
  v_active_agents bigint;
  v_total_producers bigint;
  v_total_visits bigint;
  v_avg_visits_per_agent numeric;
  v_data_quality_rate numeric;
BEGIN
  -- Count total agents from profiles table where role = 'agent'
  SELECT COUNT(*)
  INTO v_total_agents
  FROM public.profiles
  WHERE role = 'agent';

  -- Count active agents (role = 'agent' AND is_active = true)
  SELECT COUNT(*)
  INTO v_active_agents
  FROM public.profiles
  WHERE role = 'agent' AND is_active = true;

  -- Count total producers from agent_producer_assignments
  SELECT COUNT(DISTINCT producer_id)
  INTO v_total_producers
  FROM public.agent_producer_assignments
  WHERE status = 'active';

  -- Count total completed visits from visits table
  SELECT COUNT(*)
  INTO v_total_visits
  FROM public.visits
  WHERE status = 'completed';

  -- Calculate average visits per agent
  IF v_active_agents > 0 THEN
    v_avg_visits_per_agent := v_total_visits::numeric / v_active_agents;
  ELSE
    v_avg_visits_per_agent := 0;
  END IF;

  -- Calculate data quality rate based on producers with phone numbers
  SELECT COALESCE(
    (SELECT AVG(
      CASE
        WHEN p.phone IS NOT NULL AND p.phone != '' THEN 1
        ELSE 0
      END
    ) FROM public.producers p) * 100,
    0
  )
  INTO v_data_quality_rate;

  -- Return the results
  RETURN QUERY
  SELECT
    v_total_agents,
    v_active_agents,
    v_total_producers,
    v_total_visits,
    v_avg_visits_per_agent,
    v_data_quality_rate;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
