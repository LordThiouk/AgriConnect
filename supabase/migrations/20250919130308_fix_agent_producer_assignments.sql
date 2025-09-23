-- Fix agent-producer assignments to ensure the connected agent has proper assignments
-- This will create assignments for the connected agent with existing producers

-- First, let's ensure we have the correct agent ID in profiles
-- The connected agent user_id is: b00a283f-0a46-41d2-af95-8a256c9c2771

-- Find the agent profile ID for the connected user
DO $$
DECLARE
    agent_profile_id UUID;
    producer_ids UUID[];
    current_producer_id UUID;
BEGIN
    -- Get the agent profile ID for the connected user
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';
    
    -- If agent profile exists, create assignments with existing producers
    IF agent_profile_id IS NOT NULL THEN
        -- Get all existing producer IDs
        SELECT array_agg(id) INTO producer_ids
        FROM public.producers
        WHERE id IS NOT NULL;
        
        -- Create assignments for each producer
        IF producer_ids IS NOT NULL THEN
            FOREACH current_producer_id IN ARRAY producer_ids
            LOOP
                -- Insert assignment if it doesn't exist
                INSERT INTO public.agent_producer_assignments (agent_id, producer_id)
                VALUES (agent_profile_id, current_producer_id)
                ON CONFLICT (agent_id, producer_id) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE 'Created % assignments for agent %', array_length(producer_ids, 1), agent_profile_id;
        END IF;
    ELSE
        RAISE NOTICE 'Agent profile not found for user_id: b00a283f-0a46-41d2-af95-8a256c9c2771';
    END IF;
END $$;

-- Verify the assignments were created
SELECT 
    apa.agent_id,
    p.display_name as agent_name,
    pr.first_name || ' ' || pr.last_name as producer_name,
    pr.phone as producer_phone
FROM public.agent_producer_assignments apa
JOIN public.profiles p ON apa.agent_id = p.id
JOIN public.producers pr ON apa.producer_id = pr.id
WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
ORDER BY pr.first_name;
