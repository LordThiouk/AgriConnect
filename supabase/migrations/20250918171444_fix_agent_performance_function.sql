-- Fix get_agent_performance function to work with profiles table
DROP FUNCTION IF EXISTS public.get_agent_performance(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_performance(agent_id uuid)
RETURNS TABLE (
  total_producers bigint,
  total_visits bigint,
  total_plots bigint,
  total_operations bigint,
  total_observations bigint,
  visits_this_month bigint,
  avg_visits_per_producer numeric,
  last_sync_date timestamptz,
  data_completion_rate numeric,
  photos_per_plot numeric,
  gps_accuracy_rate numeric,
  avg_visit_duration numeric,
  avg_data_entry_time numeric,
  sync_success_rate numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_producers bigint;
  v_total_visits bigint;
  v_total_plots bigint;
  v_total_operations bigint;
  v_total_observations bigint;
  v_visits_this_month bigint;
  v_avg_visits_per_producer numeric;
  v_last_sync_date timestamptz;
BEGIN
  -- Count total producers assigned to this agent
  SELECT COUNT(DISTINCT producer_id)
  INTO v_total_producers
  FROM public.agent_producer_assignments
  WHERE agent_id = get_agent_performance.agent_id;

  -- Count total completed visits for this agent
  SELECT COUNT(*)
  INTO v_total_visits
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id AND status = 'completed';

  -- Count total plots managed by this agent
  SELECT COUNT(DISTINCT ffp.plot_id)
  INTO v_total_plots
  FROM public.farm_file_plots ffp
  JOIN public.agent_producer_assignments apa ON ffp.producer_id = apa.producer_id
  WHERE apa.agent_id = get_agent_performance.agent_id;

  -- Count total operations performed by this agent
  SELECT COUNT(*)
  INTO v_total_operations
  FROM public.operations
  WHERE performed_by = get_agent_performance.agent_id;

  -- Count total observations made by this agent
  SELECT COUNT(*)
  INTO v_total_observations
  FROM public.observations
  WHERE performed_by = get_agent_performance.agent_id;

  -- Count visits this month
  SELECT COUNT(*)
  INTO v_visits_this_month
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id 
    AND status = 'completed' 
    AND visit_date >= date_trunc('month', now());

  -- Calculate average visits per producer
  IF v_total_producers > 0 THEN
    v_avg_visits_per_producer := v_total_visits::numeric / v_total_producers;
  ELSE
    v_avg_visits_per_producer := 0;
  END IF;

  -- Get last sync date (last completed visit)
  SELECT MAX(visit_date)
  INTO v_last_sync_date
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id AND status = 'completed';

  -- Return the results with placeholder values for complex metrics
  RETURN QUERY
  SELECT
    v_total_producers,
    v_total_visits,
    v_total_plots,
    v_total_operations,
    v_total_observations,
    v_visits_this_month,
    v_avg_visits_per_producer,
    v_last_sync_date,
    0.0 as data_completion_rate, -- Placeholder
    0.0 as photos_per_plot, -- Placeholder
    0.0 as gps_accuracy_rate, -- Placeholder
    0.0 as avg_visit_duration, -- Placeholder
    0.0 as avg_data_entry_time, -- Placeholder
    0.0 as sync_success_rate; -- Placeholder
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;
