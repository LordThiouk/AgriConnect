-- Fix the get_agent_producers function to use profiles table instead of agents table
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_agent_producers(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_producers(
  agent_id_param uuid
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  phone text,
  email text,
  region text,
  is_active boolean,
  cooperative_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the agent exists in profiles table
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = agent_id_param 
    AND p.role = 'agent'
  ) THEN
    RAISE EXCEPTION 'Agent with ID % not found or is not an agent', agent_id_param;
  END IF;

  -- Return assigned producers
  RETURN QUERY
  SELECT 
    pr.id,
    pr.first_name,
    pr.last_name,
    pr.phone,
    pr.email,
    pr.region,
    pr.is_active,
    pr.cooperative_id,
    pr.created_at
  FROM public.producers pr
  JOIN public.agent_producer_assignments apa ON apa.producer_id = pr.id
  WHERE apa.agent_id = agent_id_param
  ORDER BY pr.first_name, pr.last_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_agent_producers(uuid) TO authenticated;
