-- Test direct query to verify producers can be read
-- This will help us understand if the issue is RLS or something else

DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    sample_producer_ids UUID[];
    accessible_producers INT;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    RAISE NOTICE 'Agent profile ID: %', agent_profile_id;

    -- Get some producer IDs from assignments
    SELECT array_agg(producer_id) INTO sample_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = agent_profile_id
    LIMIT 5;

    RAISE NOTICE 'Sample producer IDs from assignments: %', sample_producer_ids;

    -- Test direct query on producers table
    SELECT COUNT(*) INTO producer_count
    FROM public.producers;

    RAISE NOTICE 'Total producers in table: %', producer_count;

    -- Test query with specific producer IDs
    SELECT COUNT(*) INTO accessible_producers
    FROM public.producers
    WHERE id = ANY(sample_producer_ids);

    RAISE NOTICE 'Accessible producers with assignment IDs: %', accessible_producers;

    -- Show some sample producer data
    RAISE NOTICE 'Sample producer names:';
    FOR producer_count IN 
        SELECT COUNT(*)
        FROM public.producers
        WHERE id = ANY(sample_producer_ids)
    LOOP
        RAISE NOTICE 'Query result count: %', producer_count;
    END LOOP;

END $$;
