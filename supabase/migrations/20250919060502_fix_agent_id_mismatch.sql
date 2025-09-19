-- Migration: Fix agent ID mismatch
-- This migration creates the correct agent-producer assignment

DO $$
DECLARE
  correct_agent_id UUID := 'b00a283f-0a46-41d2-af95-8a256c9c2771'; -- The actual logged-in agent
  wrong_agent_id UUID := 'cd1675c9-15f4-4cf1-b6d7-be01d37a9b6a'; -- The agent created in previous migration
  existing_producer_id UUID;
  actual_agent_id UUID;
BEGIN
  -- Find the actual agent that exists in profiles
  SELECT id INTO actual_agent_id 
  FROM profiles 
  WHERE role = 'agent' 
  LIMIT 1;
  
  IF actual_agent_id IS NOT NULL THEN
    RAISE NOTICE 'Found existing agent: %', actual_agent_id;
    
    -- Get the producer that was assigned to the wrong agent
    SELECT producer_id INTO existing_producer_id 
    FROM agent_producer_assignments 
    WHERE agent_id = wrong_agent_id 
    LIMIT 1;
    
    IF existing_producer_id IS NOT NULL THEN
      -- Delete the wrong assignment
      DELETE FROM agent_producer_assignments WHERE agent_id = wrong_agent_id;
      
      -- Create the correct assignment with the actual agent
      INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
      VALUES (
        actual_agent_id,
        existing_producer_id,
        NOW()
      ) ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Updated agent assignment from % to % for producer %', 
        wrong_agent_id, actual_agent_id, existing_producer_id;
    ELSE
      RAISE NOTICE 'No producer found for wrong agent ID';
    END IF;
  ELSE
    RAISE NOTICE 'No agent found in profiles table';
  END IF;
END $$;