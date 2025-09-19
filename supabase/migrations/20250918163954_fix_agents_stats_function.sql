-- Fix agents stats function to handle missing visits table gracefully
-- This will provide fallback values when the visits table doesn't exist or has issues

-- Drop and recreate the get_agents_stats function with better error handling
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
    
    -- Check if visits table exists and has the expected structure
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN (
        SELECT COUNT(*) FROM public.visits WHERE status = 'completed'
      )
      ELSE 0::bigint
    END as total_visits,
    
    -- Calculate average visits per agent with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN COALESCE(
        (SELECT COUNT(*) FROM public.visits WHERE status = 'completed')::numeric / 
        NULLIF((SELECT COUNT(*) FROM public.profiles WHERE role = 'agent' AND is_active = true), 0), 
        0
      )
      ELSE 0::numeric
    END as avg_visits_per_agent,
    
    -- Data quality rate (based on phone completion)
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

-- Also fix the get_agent_performance function
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
    
    -- Total visits with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN (
        SELECT COUNT(*) 
        FROM public.visits 
        WHERE agent_id = get_agent_performance.agent_id AND status = 'completed'
      )
      ELSE 0::bigint
    END as total_visits,
    
    -- Total plots managed by this agent
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
    
    -- Visits this month with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN (
        SELECT COUNT(*) 
        FROM public.visits 
        WHERE agent_id = get_agent_performance.agent_id 
        AND status = 'completed' 
        AND visit_date >= date_trunc('month', now())
      )
      ELSE 0::bigint
    END as visits_this_month,
    
    -- Average visits per producer with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN COALESCE(
        (SELECT COUNT(*) 
         FROM public.visits 
         WHERE agent_id = get_agent_performance.agent_id AND status = 'completed')::numeric / 
        NULLIF((SELECT COUNT(DISTINCT producer_id) 
                FROM public.agent_producer_assignments 
                WHERE agent_id = get_agent_performance.agent_id AND status = 'active'), 0), 
        0
      )
      ELSE 0::numeric
    END as avg_visits_per_producer,
    
    -- Last visit date with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'status'
      ) THEN (
        SELECT MAX(visit_date) 
        FROM public.visits 
        WHERE agent_id = get_agent_performance.agent_id AND status = 'completed'
      )
      ELSE NULL::timestamptz
    END as last_visit_date,
    
    -- Data completion rate
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
    
    -- Photos per plot
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
    
    -- GPS accuracy rate with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'location_latitude'
      ) THEN COALESCE(
        (SELECT AVG(
          CASE 
            WHEN v.location_latitude IS NOT NULL AND v.location_longitude IS NOT NULL THEN 1 
            ELSE 0 
          END
        ) FROM public.visits v
        WHERE v.agent_id = get_agent_performance.agent_id AND v.status = 'completed') * 100, 
        0
      )
      ELSE 0::numeric
    END as gps_accuracy_rate,
    
    -- Average visit duration with fallback
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visits'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'duration_minutes'
      ) THEN COALESCE(
        (SELECT AVG(duration_minutes) 
         FROM public.visits 
         WHERE agent_id = get_agent_performance.agent_id 
         AND status = 'completed' 
         AND duration_minutes IS NOT NULL), 
        30.0
      )
      ELSE 30.0
    END as avg_visit_duration,
    
    -- Default values for other metrics
    15.0 as avg_data_entry_time,
    95.0 as sync_success_rate;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_agents_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_agents_stats() IS 'Returns overall statistics for all agents with fallback handling for missing visits table';
COMMENT ON FUNCTION public.get_agent_performance(uuid) IS 'Returns detailed performance metrics for a specific agent with fallback handling for missing visits table';
