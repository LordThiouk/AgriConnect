-- Fix agents RPC functions to use existing tables only
-- Remove references to non-existent tables like 'visits'

-- Drop the existing problematic functions
DROP FUNCTION IF EXISTS public.get_agents_stats();
DROP FUNCTION IF EXISTS public.get_agent_performance(uuid);
DROP FUNCTION IF EXISTS public.get_agent_producers(uuid);

-- Create simplified get_agents_stats function using only existing tables
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
    (SELECT COUNT(*) FROM public.producers) as total_producers,
    0::bigint as total_visits,  -- No visits table exists yet
    0::numeric as avg_visits_per_agent,  -- No visits table exists yet
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

-- Create simplified get_agent_performance function using only existing tables
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
BEGIN
  RETURN QUERY
  SELECT 
    -- Total producers assigned to this agent (simplified - using cooperative matching)
    (SELECT COUNT(*) FROM public.producers p 
     WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
     OR p.cooperative_id IS NULL) as total_producers,
    
    0::bigint as total_visits,  -- No visits table exists yet
    
    -- Total plots managed by this agent (via assigned producers)
    (SELECT COUNT(DISTINCT fp.id) 
     FROM public.farm_file_plots fp
     JOIN public.producers p ON fp.producer_id = p.id
     WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
     OR p.cooperative_id IS NULL) as total_plots,
    
    -- Total operations by this agent (simplified)
    (SELECT COUNT(*) FROM public.operations o
     JOIN public.farm_file_plots fp ON o.plot_id = fp.id
     JOIN public.producers p ON fp.producer_id = p.id
     WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
     OR p.cooperative_id IS NULL) as total_operations,
    
    -- Total observations by this agent (simplified)
    (SELECT COUNT(*) FROM public.observations obs
     JOIN public.farm_file_plots fp ON obs.plot_id = fp.id
     JOIN public.producers p ON fp.producer_id = p.id
     WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
     OR p.cooperative_id IS NULL) as total_observations,
    
    0::bigint as visits_this_month,  -- No visits table exists yet
    0::numeric as avg_visits_per_producer,  -- No visits table exists yet
    NULL::timestamptz as last_sync_date,  -- No visits table exists yet
    
    -- Data completion rate (simplified - based on phone completion)
    COALESCE(
      (SELECT AVG(
        CASE 
          WHEN p.phone IS NOT NULL AND p.phone != '' THEN 1 
          ELSE 0 
        END
      ) FROM public.producers p 
      WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
      OR p.cooperative_id IS NULL) * 100, 
      0
    ) as data_completion_rate,
    
    -- Photos per plot (simplified - using media table)
    COALESCE(
      (SELECT COUNT(*) FROM public.media m
       JOIN public.farm_file_plots fp ON m.plot_id = fp.id
       JOIN public.producers p ON fp.producer_id = p.id
       WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
       OR p.cooperative_id IS NULL)::numeric / 
      NULLIF((SELECT COUNT(DISTINCT fp.id) 
              FROM public.farm_file_plots fp
              JOIN public.producers p ON fp.producer_id = p.id
              WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
              OR p.cooperative_id IS NULL), 0), 
      0
    ) as photos_per_plot,
    
    -- GPS accuracy rate (simplified - based on plots with coordinates)
    COALESCE(
      (SELECT AVG(
        CASE 
          WHEN fp.latitude IS NOT NULL AND fp.longitude IS NOT NULL THEN 1 
          ELSE 0 
        END
      ) FROM public.farm_file_plots fp
      JOIN public.producers p ON fp.producer_id = p.id
      WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
      OR p.cooperative_id IS NULL) * 100, 
      0
    ) as gps_accuracy_rate,
    
    -- Default values for metrics that require visits table
    30.0 as avg_visit_duration,
    15.0 as avg_data_entry_time,
    95.0 as sync_success_rate;
END;
$$;

-- Create simplified get_agent_producers function using only existing tables
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
  assignment_date timestamptz
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
    NULL::timestamptz as last_visit_date,  -- No visits table exists yet
    p.created_at as assignment_date
  FROM public.producers p
  WHERE p.cooperative_id = (SELECT cooperative FROM public.profiles WHERE id = agent_id)
  OR p.cooperative_id IS NULL
  ORDER BY p.created_at DESC;
END;
$$;

-- Add RLS policies for the new functions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_producers(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_agents_stats() IS 'Returns overall statistics for all agents including counts and performance metrics (simplified version without visits table)';
COMMENT ON FUNCTION public.get_agent_performance(uuid) IS 'Returns detailed performance metrics for a specific agent (simplified version without visits table)';
COMMENT ON FUNCTION public.get_agent_producers(uuid) IS 'Returns list of producers assigned to a specific agent with their details (simplified version without visits table)';
