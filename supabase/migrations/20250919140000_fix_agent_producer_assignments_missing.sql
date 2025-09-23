-- Fix missing agent-producer assignments
-- The dashboard shows 394 producers but getProducers returns 0
-- This means agent_producer_assignments table is missing data

-- First, let's check what producers exist and create assignments for the connected agent
DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    assignment_count INT;
BEGIN
    -- Get the agent profile ID for the connected user
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    IF agent_profile_id IS NOT NULL THEN
        -- Count existing producers
        SELECT COUNT(*) INTO producer_count
        FROM public.producers;
        
        -- Count existing assignments for this agent
        SELECT COUNT(*) INTO assignment_count
        FROM public.agent_producer_assignments
        WHERE agent_id = agent_profile_id;
        
        RAISE NOTICE 'Agent profile ID: %, Producers: %, Existing assignments: %', 
            agent_profile_id, producer_count, assignment_count;
        
        -- If no assignments exist, create them for all producers
        IF assignment_count = 0 AND producer_count > 0 THEN
            -- Create assignments for all existing producers
            INSERT INTO public.agent_producer_assignments (agent_id, producer_id)
            SELECT agent_profile_id, id
            FROM public.producers
            ON CONFLICT (agent_id, producer_id) DO NOTHING;
            
            -- Count new assignments
            SELECT COUNT(*) INTO assignment_count
            FROM public.agent_producer_assignments
            WHERE agent_id = agent_profile_id;
            
            RAISE NOTICE 'Created % new assignments for agent %', assignment_count, agent_profile_id;
        ELSE
            RAISE NOTICE 'Assignments already exist or no producers found';
        END IF;
    ELSE
        RAISE NOTICE 'Agent profile not found for user_id: b00a283f-0a46-41d2-af95-8a256c9c2771';
    END IF;
END $$;
