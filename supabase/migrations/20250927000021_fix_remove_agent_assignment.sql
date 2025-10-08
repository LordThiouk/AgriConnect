-- Fix remove_agent_assignment function to match service call
-- The service calls it with assignment_id_param but the function expects 3 parameters

-- Drop the existing function
DROP FUNCTION IF EXISTS remove_agent_assignment(uuid, text, uuid);

-- Create the function that matches the service call
CREATE OR REPLACE FUNCTION remove_agent_assignment(assignment_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the assignment by ID
  DELETE FROM public.agent_assignments 
  WHERE id = assignment_id_param;
  
  -- Return true if a row was deleted
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION remove_agent_assignment(UUID) TO authenticated;
