-- Migration: Fix get_observations_for_agent RPC function
-- This migration fixes the column reference issue in the RPC function

-- Drop and recreate the function with correct column references
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
  observation_date DATE,
  observation_type TEXT,
  description TEXT,
  severity INTEGER,
  pest_disease_name TEXT,
  emergence_percent INTEGER,
  affected_area_percent NUMERIC,
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
    COALESCE(prof.display_name, 'Agent') as observed_by,
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
  ORDER BY o.observation_date DESC, o.created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;
