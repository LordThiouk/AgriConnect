-- Fix the update_agent_approval_status function to remove non-existent email column
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.update_agent_approval_status(uuid, text);

CREATE OR REPLACE FUNCTION public.update_agent_approval_status(
  agent_id_param uuid,
  approval_status_param text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  phone text,
  region text,
  department text,
  commune text,
  cooperative text,
  role text,
  is_active boolean,
  approval_status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_agent record;
BEGIN
  -- Validate input parameters
  IF approval_status_param NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid approval status: %. Must be one of: pending, approved, rejected', approval_status_param;
  END IF;

  -- Check if the agent exists and is actually an agent
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = agent_id_param OR p.user_id = agent_id_param) 
    AND p.role = 'agent'
  ) THEN
    RAISE EXCEPTION 'Agent with ID % not found or is not an agent', agent_id_param;
  END IF;

  -- Update the approval status
  UPDATE public.profiles p
  SET 
    approval_status = approval_status_param::public.user_approval_status,
    updated_at = now()
  WHERE (p.id = agent_id_param OR p.user_id = agent_id_param) 
  AND p.role = 'agent';

  -- Return the updated agent data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.phone,
    p.region,
    p.department,
    p.commune,
    p.cooperative,
    p.role,
    p.is_active,
    p.approval_status::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE (p.id = agent_id_param OR p.user_id = agent_id_param) 
  AND p.role = 'agent';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_agent_approval_status(uuid, text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.update_agent_approval_status(uuid, text) IS 'Updates the approval status of an agent. Can be called with either the profile id or user_id.';
