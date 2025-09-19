-- Migration: Fix agent assignments for observations
-- This migration ensures the current agent has assignments with producers to see observations

DO $$
DECLARE
  current_agent_id UUID;
  existing_producer_id UUID;
BEGIN
  -- Get the current agent ID
  SELECT id INTO current_agent_id FROM profiles WHERE role = 'agent' LIMIT 1;
  
  -- Get an existing producer
  SELECT id INTO existing_producer_id FROM producers LIMIT 1;
  
  IF existing_producer_id IS NOT NULL THEN
    -- Create agent-producer assignment if it doesn't exist
    INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
    VALUES (
      current_agent_id,
      existing_producer_id,
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Agent assignment created successfully for producer: %', existing_producer_id;
  ELSE
    RAISE NOTICE 'No producers found in the database';
  END IF;
END $$;