-- Update agents RPC functions to use the new visits table
-- This will provide real metrics instead of placeholders

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_agents_stats();
DROP FUNCTION IF EXISTS public.get_agent_performance(uuid);
DROP FUNCTION IF EXISTS public.get_agent_producers(uuid);

-- Create updated get_agents_stats function using visits table
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
    (SELECT COUNT(*) FROM public.visits WHERE status = 'completed') as total_visits,
    COALESCE(
      (SELECT COUNT(*) FROM public.visits WHERE status = 'completed')::numeric / 
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

-- Create updated get_agent_performance function using visits table
CREATE OR REPLACE FUNCTION public.get_agent_performance(agent_id uuid)
RETURNS TABLE (
  total_producers bigint,
  total_visits bigint,
  total_plots bigint,
  total_operations bigint,
  total_observations bigint,
  visits_this_month bigint,
  avg_visits_per_producer numeric,
  last_visit_date timestamptz,
  data_completion_rate numeric,
  photos_per_plot numeric,
  gps_accuracy_rate numeric,
  avg_visit_duration numeric,
  avg_data_entry_time numeric,
  sync_success_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total producers assigned to this agent
    (SELECT COUNT(DISTINCT producer_id) 
     FROM public.agent_producer_assignments 
     WHERE agent_id = get_agent_performance.agent_id AND status = 'active') as total_producers,
    
    -- Total visits by this agent
    (SELECT COUNT(*) 
     FROM public.visits 
     WHERE agent_id = get_agent_performance.agent_id AND status = 'completed') as total_visits,
    
    -- Total plots managed by this agent (via assigned producers)
    (SELECT COUNT(DISTINCT fp.id) 
     FROM public.farm_file_plots fp
     JOIN public.agent_producer_assignments apa ON fp.producer_id = apa.producer_id
     WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active') as total_plots,
    
    -- Total operations by this agent
    (SELECT COUNT(*) 
     FROM public.operations o
     JOIN public.farm_file_plots fp ON o.plot_id = fp.id
     JOIN public.agent_producer_assignments apa ON fp.producer_id = apa.producer_id
     WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active') as total_operations,
    
    -- Total observations by this agent
    (SELECT COUNT(*) 
     FROM public.observations obs
     JOIN public.farm_file_plots fp ON obs.plot_id = fp.id
     JOIN public.agent_producer_assignments apa ON fp.producer_id = apa.producer_id
     WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active') as total_observations,
    
    -- Visits this month
    (SELECT COUNT(*) 
     FROM public.visits 
     WHERE agent_id = get_agent_performance.agent_id 
     AND status = 'completed' 
     AND visit_date >= date_trunc('month', now())) as visits_this_month,
    
    -- Average visits per producer
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.visits 
       WHERE agent_id = get_agent_performance.agent_id AND status = 'completed')::numeric / 
      NULLIF((SELECT COUNT(DISTINCT producer_id) 
              FROM public.agent_producer_assignments 
              WHERE agent_id = get_agent_performance.agent_id AND status = 'active'), 0), 
      0
    ) as avg_visits_per_producer,
    
    -- Last visit date
    (SELECT MAX(visit_date) 
     FROM public.visits 
     WHERE agent_id = get_agent_performance.agent_id AND status = 'completed') as last_visit_date,
    
    -- Data completion rate (based on phone completion)
    COALESCE(
      (SELECT AVG(
        CASE 
          WHEN p.phone IS NOT NULL AND p.phone != '' THEN 1 
          ELSE 0 
        END
      ) FROM public.producers p
      JOIN public.agent_producer_assignments apa ON p.id = apa.producer_id
      WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active') * 100, 
      0
    ) as data_completion_rate,
    
    -- Photos per plot (simplified - using media table)
    COALESCE(
      (SELECT COUNT(*) FROM public.media m
       JOIN public.farm_file_plots fp ON m.plot_id = fp.id
       JOIN public.agent_producer_assignments apa ON fp.producer_id = apa.producer_id
       WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active')::numeric / 
      NULLIF((SELECT COUNT(DISTINCT fp.id) 
              FROM public.farm_file_plots fp
              JOIN public.agent_producer_assignments apa ON fp.producer_id = apa.producer_id
              WHERE apa.agent_id = get_agent_performance.agent_id AND apa.status = 'active'), 0), 
      0
    ) as photos_per_plot,
    
    -- GPS accuracy rate (based on visits with coordinates)
    COALESCE(
      (SELECT AVG(
        CASE 
          WHEN v.location_latitude IS NOT NULL AND v.location_longitude IS NOT NULL THEN 1 
          ELSE 0 
        END
      ) FROM public.visits v
      WHERE v.agent_id = get_agent_performance.agent_id AND v.status = 'completed') * 100, 
      0
    ) as gps_accuracy_rate,
    
    -- Average visit duration
    COALESCE(
      (SELECT AVG(duration_minutes) 
       FROM public.visits 
       WHERE agent_id = get_agent_performance.agent_id 
       AND status = 'completed' 
       AND duration_minutes IS NOT NULL), 
      30.0
    ) as avg_visit_duration,
    
    -- Average data entry time (placeholder - could be calculated from operations/observations)
    15.0 as avg_data_entry_time,
    
    -- Sync success rate (placeholder - could be calculated from sync logs)
    95.0 as sync_success_rate;
END;
$$;

-- Create updated get_agent_producers function using visits table
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

-- Add RLS policies for the new functions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_producers(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_agents_stats() IS 'Returns overall statistics for all agents including real visit counts and performance metrics';
COMMENT ON FUNCTION public.get_agent_performance(uuid) IS 'Returns detailed performance metrics for a specific agent including real visit data';
COMMENT ON FUNCTION public.get_agent_producers(uuid) IS 'Returns list of producers assigned to a specific agent with visit history and next visit dates';
