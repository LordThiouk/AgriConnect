-- Migration: Correction de la fonction get_agents_stats
-- Objectif: Corriger le problème de comptage dû au LEFT JOIN

-- 1. Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_agents_stats();

-- 2. Créer la fonction corrigée avec DISTINCT
CREATE FUNCTION get_agents_stats()
RETURNS TABLE(
  total_agents BIGINT,
  active_agents BIGINT,
  pending_approval_agents BIGINT,
  approved_agents BIGINT,
  total_assignments BIGINT,
  direct_producer_assignments BIGINT,
  cooperative_assignments BIGINT,
  total_producers_covered BIGINT,
  avg_assignments_per_agent NUMERIC,
  avg_producers_per_agent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH agent_counts AS (
    SELECT 
      COUNT(*) as total_agents,
      COUNT(*) FILTER (WHERE is_active = true) as active_agents,
      COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_approval_agents,
      COUNT(*) FILTER (WHERE approval_status = 'approved') as approved_agents
    FROM profiles 
    WHERE role = 'agent'
  ),
  assignment_counts AS (
    SELECT 
      COUNT(*) as total_assignments,
      COUNT(*) FILTER (WHERE assigned_to_type = 'producer') as direct_producer_assignments,
      COUNT(*) FILTER (WHERE assigned_to_type = 'cooperative') as cooperative_assignments
    FROM agent_assignments
  ),
  producers_covered AS (
    SELECT COUNT(DISTINCT prod.id) as total_producers_covered
    FROM producers prod
    WHERE EXISTS (
      SELECT 1 FROM agent_assignments aa
      JOIN profiles p ON aa.agent_id = p.id
      WHERE p.role = 'agent'
      AND (
        (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = prod.id) OR
        (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = prod.cooperative_id)
      )
    )
  )
  SELECT 
    ac.total_agents,
    ac.active_agents,
    ac.pending_approval_agents,
    ac.approved_agents,
    assc.total_assignments,
    assc.direct_producer_assignments,
    assc.cooperative_assignments,
    pc.total_producers_covered,
    CASE 
      WHEN ac.total_agents > 0 THEN ROUND(assc.total_assignments::NUMERIC / ac.total_agents, 2)
      ELSE 0
    END as avg_assignments_per_agent,
    CASE 
      WHEN ac.total_agents > 0 THEN ROUND(pc.total_producers_covered::NUMERIC / ac.total_agents, 2)
      ELSE 0
    END as avg_producers_per_agent
  FROM agent_counts ac, assignment_counts assc, producers_covered pc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
