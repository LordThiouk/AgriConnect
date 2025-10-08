-- Fix get_agent_performance function to work with current schema and correct parameter name
-- Drop all existing versions
DROP FUNCTION IF EXISTS get_agent_performance(uuid);
DROP FUNCTION IF EXISTS get_agent_performance(p_agent_id uuid);
DROP FUNCTION IF EXISTS get_agent_performance(agent_id_param uuid);

-- Create a new simplified version that works with current schema
CREATE OR REPLACE FUNCTION get_agent_performance(agent_id_param UUID)
RETURNS TABLE(
  total_visits BIGINT,
  total_producers BIGINT,
  total_plots BIGINT,
  total_operations BIGINT,
  total_observations BIGINT,
  visits_this_month BIGINT,
  avg_visits_per_month NUMERIC,
  data_quality_rate NUMERIC,
  last_visit_date TIMESTAMPTZ,
  avg_visit_duration NUMERIC
) AS $$
DECLARE
  v_total_visits BIGINT := 0;
  v_total_producers BIGINT := 0;
  v_total_plots BIGINT := 0;
  v_total_operations BIGINT := 0;
  v_total_observations BIGINT := 0;
  v_visits_this_month BIGINT := 0;
  v_avg_visits_per_month NUMERIC := 0;
  v_data_quality_rate NUMERIC := 0;
  v_last_visit_date TIMESTAMPTZ;
  v_avg_visit_duration NUMERIC := 30;
BEGIN
  -- Count total visits for this agent
  SELECT COUNT(*) INTO v_total_visits
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id_param AND status = 'completed';

  -- Count total producers assigned to this agent (using new agent_assignments table)
  SELECT COUNT(DISTINCT aa.assigned_to_id) INTO v_total_producers
  FROM public.agent_assignments aa
  WHERE aa.agent_id = get_agent_performance.agent_id_param 
    AND aa.assigned_to_type = 'producer';

  -- Count total plots (using producers table)
  SELECT COUNT(DISTINCT p.id) INTO v_total_plots
  FROM public.producers p
  JOIN public.agent_assignments aa ON p.id = aa.assigned_to_id
  WHERE aa.agent_id = get_agent_performance.agent_id_param 
    AND aa.assigned_to_type = 'producer';

  -- Count total operations
  SELECT COUNT(*) INTO v_total_operations
  FROM public.operations o
  WHERE o.performed_by = get_agent_performance.agent_id_param;

  -- Count total observations
  SELECT COUNT(*) INTO v_total_observations
  FROM public.observations obs
  WHERE obs.performed_by = get_agent_performance.agent_id_param;

  -- Count visits this month
  SELECT COUNT(*) INTO v_visits_this_month
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id_param 
    AND status = 'completed' 
    AND visit_date >= date_trunc('month', now());

  -- Calculate average visits per month (last 3 months)
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / 3
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed' 
       AND visit_date >= now() - interval '3 months'), 
    0
  ) INTO v_avg_visits_per_month;

  -- Calculate data quality rate (simplified: based on visits with notes)
  SELECT COALESCE(
    (SELECT (COUNT(*) FILTER (WHERE notes IS NOT NULL AND notes != ''))::NUMERIC / NULLIF(COUNT(*), 0) * 100
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed'), 
    0
  ) INTO v_data_quality_rate;

  -- Get last visit date
  SELECT MAX(visit_date) INTO v_last_visit_date
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id_param 
    AND status = 'completed';

  -- Calculate average visit duration
  SELECT COALESCE(
    (SELECT AVG(duration_minutes)
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed' 
       AND duration_minutes IS NOT NULL), 
    30.0
  ) INTO v_avg_visit_duration;

  -- Return the results
  RETURN QUERY
  SELECT 
    v_total_visits,
    v_total_producers,
    v_total_plots,
    v_total_operations,
    v_total_observations,
    v_visits_this_month,
    v_avg_visits_per_month,
    v_data_quality_rate,
    v_last_visit_date,
    v_avg_visit_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_agent_performance(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_agent_performance(UUID) IS 'Returns performance metrics for an agent using current schema';
