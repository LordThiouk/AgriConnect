-- Migration: Fix get_observations_for_agent RPC to use user_id
-- This migration updates the RPC function to properly handle user_id instead of profile id

DROP FUNCTION IF EXISTS get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_observations_for_agent(
  p_agent_id UUID,
  p_limit_count INTEGER DEFAULT 50,
  p_offset_count INTEGER DEFAULT 0,
  p_observation_type_filter TEXT DEFAULT NULL,
  p_severity_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  observation_type TEXT,
  observation_date DATE,
  description TEXT,
  emergence_percent INTEGER,
  pest_disease_name TEXT,
  severity INTEGER,
  affected_area_percent DECIMAL(5,2),
  recommendations TEXT,
  plot_id UUID,
  crop_id UUID,
  crop_type TEXT,
  crop_variety TEXT,
  producer_name TEXT,
  producer_phone TEXT,
  observed_by TEXT,
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
    o.observation_type,
    o.observation_date,
    o.description,
    o.emergence_percent,
    o.pest_disease_name,
    o.severity,
    o.affected_area_percent,
    o.recommendations,
    o.plot_id,
    o.crop_id,
    COALESCE(c.crop_type, 'N/A') as crop_type,
    COALESCE(c.variety, 'N/A') as crop_variety,
    COALESCE(pr.first_name || ' ' || pr.last_name, 'N/A') as producer_name,
    COALESCE(pr.phone, 'N/A') as producer_phone,
    COALESCE(prof.display_name, 'Agent') as observed_by,
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
  JOIN profiles agent_prof ON apa.agent_id = agent_prof.id
  WHERE agent_prof.user_id = p_agent_id  -- Changed: use user_id instead of agent_id
    AND (p_observation_type_filter IS NULL OR o.observation_type = p_observation_type_filter)
    AND (p_severity_filter IS NULL OR o.severity = p_severity_filter)
  ORDER BY o.observation_date DESC, o.created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;
