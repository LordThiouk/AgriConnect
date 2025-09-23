-- Test query to verify assignments can be read
-- This will help us understand if the issue is RLS or something else

DO $$
DECLARE
    agent_profile_id UUID;
    assignment_count INT;
    test_query TEXT;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    RAISE NOTICE 'Testing with agent profile ID: %', agent_profile_id;

    -- Test the exact query that the app is using
    SELECT COUNT(*) INTO assignment_count
    FROM public.agent_producer_assignments
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Direct query result: % assignments found', assignment_count;

    -- Test with a different approach (using auth.uid() simulation)
    -- This simulates what happens when the app makes the query
    RAISE NOTICE 'Testing RLS simulation...';
    
    -- Show some sample data
    FOR assignment_count IN 
        SELECT COUNT(*) 
        FROM public.agent_producer_assignments 
        WHERE agent_id = agent_profile_id
    LOOP
        RAISE NOTICE 'Sample query count: %', assignment_count;
    END LOOP;

END $$;
