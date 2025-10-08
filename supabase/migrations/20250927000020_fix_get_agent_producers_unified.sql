-- Migration: Correction de get_agent_producers_unified pour retourner les bonnes colonnes
-- Objectif: Corriger la structure de retour pour correspondre aux attentes du frontend

DROP FUNCTION IF EXISTS get_agent_producers_unified(UUID);
CREATE OR REPLACE FUNCTION get_agent_producers_unified(p_agent_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  region TEXT,
  is_active BOOLEAN,
  cooperative_name TEXT,
  assignment_type TEXT,
  assigned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Producteurs via assignation directe
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    p.region,
    p.is_active,
    c.name as cooperative_name,
    'direct'::TEXT as assignment_type,
    aa.assigned_at
  FROM public.agent_assignments aa
  JOIN public.producers p ON aa.assigned_to_id = p.id
  LEFT JOIN public.cooperatives c ON p.cooperative_id = c.id
  WHERE aa.agent_id = p_agent_id 
    AND aa.assigned_to_type = 'producer'
  
  UNION
  
  -- Producteurs via assignation à la coopérative
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    p.region,
    p.is_active,
    c.name as cooperative_name,
    'via_cooperative'::TEXT as assignment_type,
    aa.assigned_at
  FROM public.agent_assignments aa
  JOIN public.cooperatives c ON aa.assigned_to_id = c.id
  JOIN public.producers p ON p.cooperative_id = c.id
  WHERE aa.agent_id = p_agent_id 
    AND aa.assigned_to_type = 'cooperative'
  
  ORDER BY assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION get_agent_producers_unified(UUID) TO authenticated;

-- 2. Corriger get_available_producers_for_agent
DROP FUNCTION IF EXISTS get_available_producers_for_agent(UUID);
CREATE OR REPLACE FUNCTION get_available_producers_for_agent(p_agent_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  region TEXT,
  is_active BOOLEAN,
  cooperative_name TEXT,
  is_assigned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    p.region,
    p.is_active,
    c.name as cooperative_name,
    EXISTS(
      SELECT 1 FROM public.agent_assignments aa
      WHERE aa.agent_id = p_agent_id
        AND (
          (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p.id) OR
          (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = p.cooperative_id)
        )
    ) as is_assigned
  FROM public.producers p
  LEFT JOIN public.cooperatives c ON p.cooperative_id = c.id
  WHERE p.is_active = true
  ORDER BY p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION get_available_producers_for_agent(UUID) TO authenticated;
