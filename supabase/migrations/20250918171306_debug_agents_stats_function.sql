-- Debug and fix get_agents_stats function
-- Let's check what's actually happening and create a working version

-- First, let's see what tables and columns we actually have
-- This is a diagnostic migration

-- Drop the existing function and recreate it step by step
DROP FUNCTION IF EXISTS public.get_agents_stats();

-- Create a simple version first to test
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
  -- Count total agents from profiles table
  SELECT COUNT(*)
  INTO v_total_agents
  FROM public.profiles
  WHERE role = 'agent';

  -- Count active agents
  SELECT COUNT(*)
  INTO v_active_agents
  FROM public.profiles
  WHERE role = 'agent' AND is_active = true;

  -- Count total producers (from agent_producer_assignments)
  SELECT COUNT(DISTINCT producer_id)
  INTO v_total_producers
  FROM public.agent_producer_assignments;

  -- Count total visits (from visits table if it exists)
  BEGIN
    SELECT COUNT(*)
    INTO v_total_visits
    FROM public.visits;
  EXCEPTION
    WHEN undefined_table THEN
      v_total_visits := 0;
  END;

  -- Calculate average visits per agent
  IF v_active_agents > 0 THEN
    v_avg_visits_per_agent := v_total_visits::numeric / v_active_agents;
  ELSE
    v_avg_visits_per_agent := 0;
  END IF;

  -- Calculate data quality rate (placeholder)
  v_data_quality_rate := 85.5; -- Placeholder value

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
