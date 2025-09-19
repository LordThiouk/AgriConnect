-- Create RPC function to assign producer to agent (bypass RLS)
CREATE OR REPLACE FUNCTION public.assign_producer_to_agent(
  producer_id_param uuid,
  agent_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.agent_producer_assignments (
    agent_id,
    producer_id,
    assigned_at
  ) VALUES (
    agent_id_param,
    producer_id_param,
    NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_producer_to_agent(uuid, uuid) TO authenticated;

-- Create RPC function to unassign producer from agent (bypass RLS)
CREATE OR REPLACE FUNCTION public.unassign_producer_from_agent(
  producer_id_param uuid,
  agent_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.agent_producer_assignments 
  WHERE agent_id = agent_id_param 
    AND producer_id = producer_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.unassign_producer_from_agent(uuid, uuid) TO authenticated;
