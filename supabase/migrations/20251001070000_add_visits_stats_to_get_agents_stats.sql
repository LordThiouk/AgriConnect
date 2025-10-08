-- Migration: Ajout des statistiques de visites et qualité des données à get_agents_stats
-- Objectif: Ajouter total_visits, avg_visits_per_agent et data_quality_rate à la fonction

DROP FUNCTION IF EXISTS get_agents_stats();

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
  avg_producers_per_agent NUMERIC,
  -- Nouvelles colonnes pour le dashboard web
  total_visits BIGINT,
  avg_visits_per_agent NUMERIC,
  data_quality_rate NUMERIC
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
  ),
  visits_stats AS (
    -- Total visits pour tous les agents
    SELECT 
      COUNT(*) as total_visits
    FROM visits v
    JOIN profiles p ON v.agent_id = p.id
    WHERE p.role = 'agent'
  ),
  quality_stats AS (
    -- Calcul du taux de qualité basé sur les visites avec opérations et observations
    SELECT 
      CASE 
        WHEN COUNT(v.id) > 0 THEN 
          ROUND(
            (
              -- Visites avec au moins une opération
              COUNT(DISTINCT CASE 
                WHEN EXISTS (
                  SELECT 1 FROM operations o 
                  WHERE o.plot_id = v.plot_id 
                  AND DATE(o.operation_date) = DATE(v.visit_date)
                ) THEN v.id 
              END) * 100.0 / COUNT(v.id)
            ),
            2
          )
        ELSE 0
      END as data_quality_rate
    FROM visits v
    JOIN profiles p ON v.agent_id = p.id
    WHERE p.role = 'agent'
    AND v.status = 'completed'
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
    END as avg_producers_per_agent,
    -- Nouvelles colonnes
    vs.total_visits,
    CASE 
      WHEN ac.total_agents > 0 THEN ROUND(vs.total_visits::NUMERIC / ac.total_agents, 1)
      ELSE 0
    END as avg_visits_per_agent,
    qs.data_quality_rate
  FROM agent_counts ac, assignment_counts assc, producers_covered pc, visits_stats vs, quality_stats qs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_agents_stats() TO authenticated;

-- Commentaire
COMMENT ON FUNCTION get_agents_stats() IS 'Retourne les statistiques globales des agents incluant visites et qualité des données';

