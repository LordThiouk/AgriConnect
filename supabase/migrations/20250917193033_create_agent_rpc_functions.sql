-- RPC Functions for Agent Management
-- These functions simplify complex joins and provide clean APIs

-- Function to get available agents with their phone numbers
CREATE OR REPLACE FUNCTION get_available_agents()
RETURNS TABLE (
  id uuid,
  display_name text,
  phone text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    COALESCE(pr.phone, 'Non disponible') as phone
  FROM profiles p
  LEFT JOIN producers pr ON p.id = pr.profile_id
  WHERE p.role = 'agent' 
    AND p.approval_status = 'approved'
  ORDER BY p.display_name;
END;
$$;

-- Function to get assigned agents for a producer with their phone numbers
CREATE OR REPLACE FUNCTION get_producer_assigned_agents(producer_uuid uuid)
RETURNS TABLE (
  agent_id uuid,
  display_name text,
  phone text,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    apa.agent_id,
    p.display_name,
    COALESCE(pr.phone, 'Non disponible') as phone,
    apa.assigned_at
  FROM agent_producer_assignments apa
  JOIN profiles p ON apa.agent_id = p.id
  LEFT JOIN producers pr ON p.id = pr.profile_id
  WHERE apa.producer_id = producer_uuid
  ORDER BY apa.assigned_at DESC;
END;
$$;

-- Function to assign an agent to a producer
CREATE OR REPLACE FUNCTION assign_agent_to_producer(
  producer_uuid uuid,
  agent_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if assignment already exists
  IF EXISTS (
    SELECT 1 FROM agent_producer_assignments 
    WHERE producer_id = producer_uuid AND agent_id = agent_uuid
  ) THEN
    RETURN false;
  END IF;
  
  -- Insert new assignment
  INSERT INTO agent_producer_assignments (producer_id, agent_id, assigned_at)
  VALUES (producer_uuid, agent_uuid, NOW());
  
  RETURN true;
END;
$$;

-- Function to unassign an agent from a producer
CREATE OR REPLACE FUNCTION unassign_agent_from_producer(
  producer_uuid uuid,
  agent_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM agent_producer_assignments 
  WHERE producer_id = producer_uuid AND agent_id = agent_uuid;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_available_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_assigned_agents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_agent_to_producer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_agent_from_producer(uuid, uuid) TO authenticated;
