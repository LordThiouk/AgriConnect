-- Migration: Correction finale de la fonction get_available_agents
-- Objectif: Corriger définitivement le conflit de structure

-- 1. Supprimer toutes les versions de la fonction
DROP FUNCTION IF EXISTS get_available_agents();
DROP FUNCTION IF EXISTS get_available_agents(UUID);

-- 2. Créer la fonction corrigée avec la structure exacte attendue
CREATE FUNCTION get_available_agents()
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  region TEXT,
  cooperative_name TEXT,
  total_assigned_producers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as agent_id,
    p.display_name as agent_name,
    p.region,
    -- Récupérer le nom de la coopérative principale (première assignation coopérative)
    (
      SELECT c.name 
      FROM agent_assignments aa
      JOIN cooperatives c ON aa.assigned_to_id = c.id
      WHERE aa.agent_id = p.id 
      AND aa.assigned_to_type = 'cooperative'
      ORDER BY aa.assigned_at ASC
      LIMIT 1
    ) as cooperative_name,
    COUNT(DISTINCT CASE WHEN aa.assigned_to_type = 'producer' THEN aa.assigned_to_id ELSE NULL END) +
    COUNT(DISTINCT CASE WHEN aa.assigned_to_type = 'cooperative' THEN (SELECT COUNT(id) FROM producers WHERE cooperative_id = aa.assigned_to_id) ELSE NULL END) as total_assigned_producers
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  WHERE p.role = 'agent' AND p.is_active = TRUE AND p.approval_status = 'approved'
  GROUP BY p.id, p.display_name, p.region
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
