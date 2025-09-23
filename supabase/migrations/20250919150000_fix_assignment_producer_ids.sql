-- Fix assignment producer IDs to match actual producer IDs
-- Delete old assignments and create new ones with correct producer IDs

DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    assignment_count_before INT;
    assignment_count_after INT;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    -- Count producers
    SELECT COUNT(*) INTO producer_count FROM public.producers;
    
    -- Count current assignments
    SELECT COUNT(*) INTO assignment_count_before 
    FROM public.agent_producer_assignments 
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Agent: %, Producers: %, Assignments before: %', 
        agent_profile_id, producer_count, assignment_count_before;

    -- Delete all existing assignments for this agent
    DELETE FROM public.agent_producer_assignments 
    WHERE agent_id = agent_profile_id;

    -- Create new assignments with actual producer IDs
    INSERT INTO public.agent_producer_assignments (agent_id, producer_id)
    SELECT agent_profile_id, id
    FROM public.producers;

    -- Count new assignments
    SELECT COUNT(*) INTO assignment_count_after 
    FROM public.agent_producer_assignments 
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Assignments after: %', assignment_count_after;
    RAISE NOTICE 'Fixed assignments successfully!';

END $$;
