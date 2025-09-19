-- Migration: Fix connected agent assignments
-- This migration creates assignments for the connected agent using user_id

DO $$
DECLARE
  connected_user_id UUID := 'b00a283f-0a46-41d2-af95-8a256c9c2771'; -- The actual logged-in user_id
  connected_profile_id UUID;
  existing_agent_id UUID := '0f33842a-a1f1-4ad5-8113-39285e5013df'; -- The agent with existing assignments
  producer_ids UUID[];
  assignment_count INTEGER;
BEGIN
  -- Find the profile ID for the connected user
  SELECT id INTO connected_profile_id
  FROM profiles 
  WHERE user_id = connected_user_id;
  
  IF connected_profile_id IS NULL THEN
    RAISE NOTICE 'No profile found for user_id %', connected_user_id;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found profile % for user_id %', connected_profile_id, connected_user_id;
  
  -- Get all producers assigned to the existing agent
  SELECT ARRAY_AGG(producer_id) INTO producer_ids
  FROM agent_producer_assignments 
  WHERE agent_id = existing_agent_id;
  
  RAISE NOTICE 'Found % producers assigned to existing agent', array_length(producer_ids, 1);
  
  -- Create assignments for the connected agent with the same producers
  IF producer_ids IS NOT NULL AND array_length(producer_ids, 1) > 0 THEN
    -- Insert assignments for the connected agent
    INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
    SELECT 
      connected_profile_id,
      unnest(producer_ids),
      NOW()
    ON CONFLICT (agent_id, producer_id) DO NOTHING;
    
    -- Count how many assignments were created
    GET DIAGNOSTICS assignment_count = ROW_COUNT;
    
    RAISE NOTICE 'Created % new assignments for connected agent %', assignment_count, connected_profile_id;
  ELSE
    RAISE NOTICE 'No producers found for existing agent';
  END IF;
END $$;