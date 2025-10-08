-- Fix get_agent_performance function to use media table instead of non-existent photo_url column
DROP FUNCTION IF EXISTS get_agent_performance(UUID);

-- Create corrected version using media table
CREATE OR REPLACE FUNCTION get_agent_performance(agent_id_param UUID)
RETURNS TABLE(
  total_visits BIGINT,
  total_producers BIGINT,
  total_plots BIGINT,
  total_operations BIGINT,
  total_observations BIGINT,
  visits_this_month BIGINT,
  avg_visits_per_producer NUMERIC,
  last_visit_date TIMESTAMPTZ,
  data_completion_rate NUMERIC,
  photos_per_plot NUMERIC,
  gps_accuracy_rate NUMERIC,
  avg_visit_duration NUMERIC,
  avg_data_entry_time NUMERIC,
  sync_success_rate NUMERIC,
  avg_visits_per_month NUMERIC,
  data_quality_rate NUMERIC
) AS $$
DECLARE
  v_total_visits BIGINT := 0;
  v_total_producers BIGINT := 0;
  v_total_plots BIGINT := 0;
  v_total_operations BIGINT := 0;
  v_total_observations BIGINT := 0;
  v_visits_this_month BIGINT := 0;
  v_avg_visits_per_producer NUMERIC := 0;
  v_last_visit_date TIMESTAMPTZ;
  v_data_completion_rate NUMERIC := 0;
  v_photos_per_plot NUMERIC := 0;
  v_gps_accuracy_rate NUMERIC := 0;
  v_avg_visit_duration NUMERIC := 30;
  v_avg_data_entry_time NUMERIC := 5;
  v_sync_success_rate NUMERIC := 100;
  v_avg_visits_per_month NUMERIC := 0;
  v_data_quality_rate NUMERIC := 0;
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

  -- Count total operations (using correct column name: performer_id)
  SELECT COUNT(*) INTO v_total_operations
  FROM public.operations o
  WHERE o.performer_id = get_agent_performance.agent_id_param;

  -- Count total observations (using correct column name: observed_by)
  SELECT COUNT(*) INTO v_total_observations
  FROM public.observations obs
  WHERE obs.observed_by = get_agent_performance.agent_id_param;

  -- Count visits this month
  SELECT COUNT(*) INTO v_visits_this_month
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id_param 
    AND status = 'completed' 
    AND visit_date >= date_trunc('month', now());

  -- Calculate average visits per producer
  SELECT COALESCE(
    CASE 
      WHEN v_total_producers > 0 THEN v_total_visits::NUMERIC / v_total_producers
      ELSE 0
    END, 0
  ) INTO v_avg_visits_per_producer;

  -- Get last visit date
  SELECT MAX(visit_date) INTO v_last_visit_date
  FROM public.visits
  WHERE agent_id = get_agent_performance.agent_id_param 
    AND status = 'completed';

  -- Calculate data completion rate (based on visits with complete information)
  SELECT COALESCE(
    (SELECT (COUNT(*) FILTER (WHERE notes IS NOT NULL AND notes != '' AND duration_minutes IS NOT NULL))::NUMERIC / NULLIF(COUNT(*), 0) * 100
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed'), 
    0
  ) INTO v_data_completion_rate;

  -- Calculate photos per plot using media table
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / NULLIF(v_total_plots, 0)
     FROM public.media m
     JOIN public.agent_assignments aa ON m.owner_profile_id = aa.agent_id
     WHERE aa.agent_id = get_agent_performance.agent_id_param 
       AND aa.assigned_to_type = 'producer'
       AND m.entity_type IN ('plot', 'crop', 'operation', 'observation')), 
    0
  ) INTO v_photos_per_plot;

  -- GPS accuracy rate (placeholder: assume 95% for now)
  v_gps_accuracy_rate := 95.0;

  -- Calculate average visit duration
  SELECT COALESCE(
    (SELECT AVG(duration_minutes)
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed' 
       AND duration_minutes IS NOT NULL), 
    30.0
  ) INTO v_avg_visit_duration;

  -- Average data entry time (placeholder: 5 minutes)
  v_avg_data_entry_time := 5.0;

  -- Sync success rate (placeholder: 100% for now)
  v_sync_success_rate := 100.0;

  -- Calculate average visits per month (last 3 months)
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / 3
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed' 
       AND visit_date >= now() - interval '3 months'), 
    0
  ) INTO v_avg_visits_per_month;

  -- Calculate data quality rate (based on visits with notes)
  SELECT COALESCE(
    (SELECT (COUNT(*) FILTER (WHERE notes IS NOT NULL AND notes != ''))::NUMERIC / NULLIF(COUNT(*), 0) * 100
     FROM public.visits
     WHERE agent_id = get_agent_performance.agent_id_param 
       AND status = 'completed'), 
    0
  ) INTO v_data_quality_rate;

  -- Return the results
  RETURN QUERY
  SELECT 
    v_total_visits,
    v_total_producers,
    v_total_plots,
    v_total_operations,
    v_total_observations,
    v_visits_this_month,
    v_avg_visits_per_producer,
    v_last_visit_date,
    v_data_completion_rate,
    v_photos_per_plot,
    v_gps_accuracy_rate,
    v_avg_visit_duration,
    v_avg_data_entry_time,
    v_sync_success_rate,
    v_avg_visits_per_month,
    v_data_quality_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_agent_performance(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_agent_performance(UUID) IS 'Returns complete performance metrics for an agent using media table for photos';
