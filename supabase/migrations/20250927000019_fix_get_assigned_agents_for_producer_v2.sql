-- Migration: Correction de get_assigned_agents_for_producer pour inclure le téléphone (v2)
-- Objectif: Ajouter le numéro de téléphone et autres informations dans la fonction avec le bon type

DROP FUNCTION IF EXISTS get_assigned_agents_for_producer(UUID);
CREATE OR REPLACE FUNCTION get_assigned_agents_for_producer(p_producer_id UUID)
RETURNS TABLE(
  agent_id UUID,
  user_id UUID,
  agent_name TEXT,
  phone TEXT,
  region TEXT,
  department TEXT,
  commune TEXT,
  is_active BOOLEAN,
  approval_status TEXT,
  assignment_type TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Agents assignés directement au producteur
  SELECT 
    p.id as agent_id,
    p.user_id,
    p.display_name as agent_name,
    p.phone,
    p.region,
    p.department,
    p.commune,
    p.is_active,
    p.approval_status::TEXT, -- Cast vers TEXT pour éviter l'erreur de type
    'direct' as assignment_type,
    aa.assigned_at,
    p.created_at,
    p.updated_at
  FROM public.agent_assignments aa
  JOIN public.profiles p ON aa.agent_id = p.id
  WHERE aa.assigned_to_type = 'producer' 
    AND aa.assigned_to_id = p_producer_id
    AND p.role = 'agent'
  
  UNION
  
  -- Agents assignés via coopérative
  SELECT 
    p.id as agent_id,
    p.user_id,
    p.display_name as agent_name,
    p.phone,
    p.region,
    p.department,
    p.commune,
    p.is_active,
    p.approval_status::TEXT, -- Cast vers TEXT pour éviter l'erreur de type
    'via_cooperative' as assignment_type,
    aa.assigned_at,
    p.created_at,
    p.updated_at
  FROM public.agent_assignments aa
  JOIN public.profiles p ON aa.agent_id = p.id
  JOIN public.producers prod ON aa.assigned_to_id = prod.cooperative_id
  WHERE aa.assigned_to_type = 'cooperative' 
    AND prod.id = p_producer_id
    AND p.role = 'agent'
  
  ORDER BY assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION get_assigned_agents_for_producer(UUID) TO authenticated;
