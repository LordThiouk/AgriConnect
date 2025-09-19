-- Fix the get_agent_performance function to use profiles table instead of agents table
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_agent_performance(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_performance(
  agent_id_param uuid
)
RETURNS TABLE (
  total_visits bigint,
  total_producers bigint,
  total_plots bigint,
  avg_visits_per_month numeric,
  data_quality_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_exists boolean;
  visits_count bigint := 0;
  producers_count bigint := 0;
  plots_count bigint := 0;
  avg_visits numeric := 0;
  quality_rate numeric := 0;
BEGIN
  -- Check if the agent exists in profiles table
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = agent_id_param 
    AND p.role = 'agent'
  ) INTO agent_exists;

  IF NOT agent_exists THEN
    RAISE EXCEPTION 'Agent with ID % not found or is not an agent', agent_id_param;
  END IF;

  -- Count visits (if visits table exists)
  BEGIN
    SELECT COUNT(*) INTO visits_count
    FROM public.visits v
    WHERE v.agent_id = agent_id_param;
  EXCEPTION
    WHEN undefined_table THEN
      visits_count := 0;
  END;

  -- Count assigned producers
  BEGIN
    SELECT COUNT(*) INTO producers_count
    FROM public.agent_producer_assignments apa
    WHERE apa.agent_id = agent_id_param;
  EXCEPTION
    WHEN undefined_table THEN
      producers_count := 0;
  END;

  -- Count plots through producers
  BEGIN
    SELECT COUNT(DISTINCT p.id) INTO plots_count
    FROM public.plots p
    JOIN public.agent_producer_assignments apa ON apa.producer_id = p.producer_id
    WHERE apa.agent_id = agent_id_param;
  EXCEPTION
    WHEN undefined_table THEN
      plots_count := 0;
  END;

  -- Calculate average visits per month (last 12 months)
  BEGIN
    SELECT COALESCE(AVG(monthly_visits), 0) INTO avg_visits
    FROM (
      SELECT COUNT(*) as monthly_visits
      FROM public.visits v
      WHERE v.agent_id = agent_id_param
      AND v.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', v.created_at)
    ) monthly_stats;
  EXCEPTION
    WHEN undefined_table THEN
      avg_visits := 0;
  END;

  -- Calculate data quality rate (percentage of plots with complete data)
  BEGIN
    SELECT COALESCE(
      (COUNT(CASE WHEN p.area_hectares IS NOT NULL AND p.area_hectares > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
      0
    ) INTO quality_rate
    FROM public.plots p
    JOIN public.agent_producer_assignments apa ON apa.producer_id = p.producer_id
    WHERE apa.agent_id = agent_id_param;
  EXCEPTION
    WHEN undefined_table THEN
      quality_rate := 0;
  END;

  -- Return the performance metrics
  RETURN QUERY
  SELECT 
    visits_count,
    producers_count,
    plots_count,
    avg_visits,
    quality_rate;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;
