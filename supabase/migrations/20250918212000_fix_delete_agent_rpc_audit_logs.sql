-- Fix the delete_agent_profile RPC function to use correct column name for audit_logs
DROP FUNCTION IF EXISTS public.delete_agent_profile(uuid);

-- Create the corrected delete_agent_profile RPC function
CREATE OR REPLACE FUNCTION public.delete_agent_profile(
  agent_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the agent exists and has the 'agent' role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = agent_id_param AND p.role = 'agent'
  ) THEN
    RAISE EXCEPTION 'Agent with ID % not found or is not an agent', agent_id_param;
  END IF;

  -- Delete related records first (in order to avoid foreign key constraints)
  
  -- 1. Delete agent assignments (agent_producer_assignments)
  DELETE FROM public.agent_producer_assignments 
  WHERE agent_id = agent_id_param;

  -- 2. Delete visits where agent is the performer (using agent_id column)
  DELETE FROM public.visits 
  WHERE agent_id = agent_id_param;

  -- 3. Delete audit logs related to this agent (using changed_by column)
  DELETE FROM public.audit_logs 
  WHERE changed_by = agent_id_param;

  -- 4. Finally, delete the agent profile
  DELETE FROM public.profiles 
  WHERE id = agent_id_param AND role = 'agent';

  -- Return true if deletion was successful
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_agent_profile(uuid) TO authenticated;
