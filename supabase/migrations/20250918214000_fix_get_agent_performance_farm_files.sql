-- Fix the get_agent_performance RPC function to use correct column name for farm_files
DROP FUNCTION IF EXISTS public.get_agent_performance(uuid);

-- Create the corrected get_agent_performance RPC function
CREATE OR REPLACE FUNCTION public.get_agent_performance(
  agent_id_param uuid
)
RETURNS TABLE (
  total_producers bigint,
  total_plots bigint,
  total_visits bigint,
  avg_visits_per_month numeric,
  data_quality_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total producers assigned to this agent
    COUNT(DISTINCT apa.producer_id) as total_producers,
    
    -- Total plots (from farm_file_plots which has area_hectares)
    COUNT(DISTINCT ffp.plot_id) as total_plots,
    
    -- Total visits by this agent
    COUNT(DISTINCT v.id) as total_visits,
    
    -- Average visits per month (last 12 months)
    COALESCE(
      COUNT(DISTINCT v.id)::numeric / GREATEST(
        EXTRACT(EPOCH FROM (NOW() - MIN(v.visit_date))) / (30.44 * 24 * 3600), 1
      ), 0
    ) as avg_visits_per_month,
    
    -- Data quality rate (visits with notes vs total visits)
    COALESCE(
      COUNT(CASE WHEN v.notes IS NOT NULL AND v.notes != '' THEN 1 END)::numeric / 
      NULLIF(COUNT(v.id), 0), 0
    ) as data_quality_rate
    
  FROM public.agent_producer_assignments apa
  LEFT JOIN public.producers pr ON apa.producer_id = pr.id
  LEFT JOIN public.farm_files ff ON pr.id = ff.responsible_producer_id
  LEFT JOIN public.farm_file_plots ffp ON ff.id = ffp.farm_file_id
  LEFT JOIN public.visits v ON apa.agent_id = v.agent_id 
    AND v.visit_date >= NOW() - INTERVAL '12 months'
  WHERE apa.agent_id = agent_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_agent_performance(uuid) TO authenticated;
