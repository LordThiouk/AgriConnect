-- Migration: Create RPC function to get all observations for an agent's assigned producers
-- This function retrieves observations from all plots managed by the agent

CREATE OR REPLACE FUNCTION get_observations_for_agent(
  p_agent_id UUID,
  p_limit_count INTEGER DEFAULT 50,
  p_offset_count INTEGER DEFAULT 0,
  p_observation_type_filter TEXT DEFAULT NULL,
  p_severity_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  observation_date TIMESTAMPTZ,
  observation_type TEXT,
  description TEXT,
  severity INTEGER,
  pest_disease_name TEXT,
  emergence_percent INTEGER,
  affected_area_percent INTEGER,
  recommendations TEXT,
  plot_id UUID,
  plot_name TEXT,
  producer_name TEXT,
  crop_id UUID,
  crop_type TEXT,
  crop_variety TEXT,
  observed_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_critical BOOLEAN,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.observation_date,
    o.observation_type,
    o.description,
    o.severity,
    o.pest_disease_name,
    o.emergence_percent,
    o.affected_area_percent,
    o.recommendations,
    o.plot_id,
    p.name as plot_name,
    pr.first_name || ' ' || pr.last_name as producer_name,
    o.crop_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(prof.first_name || ' ' || prof.last_name, 'Agent') as observed_by,
    o.created_at,
    o.updated_at,
    (o.severity >= 4) as is_critical,
    CASE 
      WHEN o.severity >= 4 THEN 'critical'
      ELSE 'new'
    END as status
  FROM observations o
  JOIN farm_file_plots ffp ON o.plot_id = ffp.id
  JOIN plots p ON ffp.plot_id = p.id
  JOIN farm_files ff ON ffp.farm_file_id = ff.id
  JOIN producers pr ON ff.responsible_producer_id = pr.id
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN profiles prof ON o.observed_by = prof.id
  JOIN agent_producer_assignments apa ON pr.id = apa.producer_id
  WHERE apa.agent_id = p_agent_id
    AND (p_observation_type_filter IS NULL OR o.observation_type = p_observation_type_filter)
    AND (p_severity_filter IS NULL OR o.severity = p_severity_filter)
  ORDER BY 
    o.severity DESC NULLS LAST,
    o.observation_date DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER) TO authenticated;

-- Add RLS policy to ensure agents can only access observations from their assigned producers
CREATE POLICY "Agents can view observations from assigned producers" ON observations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farm_file_plots ffp
      JOIN farm_files ff ON ffp.farm_file_id = ff.id
      JOIN producers pr ON ff.responsible_producer_id = pr.id
      JOIN agent_producer_assignments apa ON pr.id = apa.producer_id
      WHERE ffp.id = observations.plot_id
        AND apa.agent_id = auth.uid()
    )
  );
