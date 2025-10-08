-- Force recreate remove_agent_assignment function to refresh schema cache
-- Drop all possible variations of the function
DROP FUNCTION IF EXISTS remove_agent_assignment(uuid);
DROP FUNCTION IF EXISTS remove_agent_assignment(uuid, text, uuid);
DROP FUNCTION IF EXISTS remove_agent_assignment(assignment_id_param uuid);

-- Recreate the function with explicit parameter name
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

-- Add a comment to help with debugging
COMMENT ON FUNCTION remove_agent_assignment(UUID) IS 'Removes an agent assignment by assignment ID';
