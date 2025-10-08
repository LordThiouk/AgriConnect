-- Migration: Correction uniquement de la fonction get_available_agents
-- Objectif: Corriger le conflit de structure sans toucher à l'ancienne table

-- 1. Supprimer la fonction existante avec conflit
DROP FUNCTION IF EXISTS get_available_agents();

-- 2. Créer la fonction corrigée avec la bonne structure
CREATE FUNCTION get_available_agents()
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  region TEXT,
  cooperative_name TEXT,
  is_active BOOLEAN,
  approval_status TEXT,
  total_assignments BIGINT
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
    p.is_active,
    p.approval_status,
    COUNT(aa.id) as total_assignments
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  WHERE p.role = 'agent'
  GROUP BY p.id, p.display_name, p.region, p.is_active, p.approval_status
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
