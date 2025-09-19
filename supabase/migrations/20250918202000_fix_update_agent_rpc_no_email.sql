-- Fix the update_agent_profile RPC function to remove non-existent email column
CREATE OR REPLACE FUNCTION public.update_agent_profile(
  agent_id_param uuid,
  display_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  region_param text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  phone text,
  region text,
  role text,
  is_active boolean,
  approval_status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the agent exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = agent_id_param 
    AND p.role = 'agent'
  ) THEN
    RAISE EXCEPTION 'Agent with ID % not found or is not an agent', agent_id_param;
  END IF;

  -- Update the agent information using fully qualified column names
  UPDATE public.profiles 
  SET 
    display_name = COALESCE(display_name_param, profiles.display_name),
    phone = COALESCE(phone_param, profiles.phone),
    region = COALESCE(region_param, profiles.region),
    updated_at = NOW()
  WHERE profiles.id = agent_id_param AND profiles.role = 'agent';

  -- Return the updated agent information
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.phone,
    p.region,
    p.role,
    p.is_active,
    p.approval_status,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = agent_id_param AND p.role = 'agent';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_agent_profile(uuid, text, text, text) TO authenticated;
