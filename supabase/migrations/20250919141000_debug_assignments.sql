-- Debug des assignations agent-producteur
-- Vérifier pourquoi getProducers() ne trouve pas les assignations

DO $$
DECLARE
    agent_profile_id UUID;
    assignment_count INT;
    producer_count INT;
    sample_assignments RECORD;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    RAISE NOTICE 'Agent profile ID: %', agent_profile_id;

    -- Count assignments for this agent
    SELECT COUNT(*) INTO assignment_count
    FROM public.agent_producer_assignments
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Assignments count for agent: %', assignment_count;

    -- Count total producers
    SELECT COUNT(*) INTO producer_count
    FROM public.producers;

    RAISE NOTICE 'Total producers: %', producer_count;

    -- Show sample assignments
    FOR sample_assignments IN 
        SELECT agent_id, producer_id 
        FROM public.agent_producer_assignments 
        WHERE agent_id = agent_profile_id 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Assignment: agent_id=%, producer_id=%', 
            sample_assignments.agent_id, sample_assignments.producer_id;
    END LOOP;

    -- Check if there are any assignments at all
    SELECT COUNT(*) INTO assignment_count
    FROM public.agent_producer_assignments;

    RAISE NOTICE 'Total assignments in table: %', assignment_count;

    -- Show sample of all assignments
    FOR sample_assignments IN 
        SELECT agent_id, producer_id 
        FROM public.agent_producer_assignments 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Any assignment: agent_id=%, producer_id=%', 
            sample_assignments.agent_id, sample_assignments.producer_id;
    END LOOP;
END $$;
