-- Debug: Vérifier la correspondance entre producer_id dans assignments et id dans producers
-- This will help us understand if the producer IDs match

DO $$
DECLARE
    agent_profile_id UUID;
    assignment_producer_ids UUID[];
    producer_ids_in_table UUID[];
    matching_ids UUID[];
    missing_ids UUID[];
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    RAISE NOTICE 'Agent profile ID: %', agent_profile_id;

    -- Get producer IDs from assignments
    SELECT array_agg(producer_id) INTO assignment_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Producer IDs from assignments: %', array_length(assignment_producer_ids, 1);

    -- Get producer IDs that exist in producers table
    SELECT array_agg(id) INTO producer_ids_in_table
    FROM public.producers;

    RAISE NOTICE 'Producer IDs in producers table: %', array_length(producer_ids_in_table, 1);

    -- Find matching IDs
    SELECT array_agg(id) INTO matching_ids
    FROM public.producers
    WHERE id = ANY(assignment_producer_ids);

    RAISE NOTICE 'Matching producer IDs: %', array_length(matching_ids, 1);

    -- Find missing IDs
    SELECT array_agg(producer_id) INTO missing_ids
    FROM unnest(assignment_producer_ids) AS producer_id
    WHERE producer_id NOT IN (SELECT id FROM public.producers);

    RAISE NOTICE 'Missing producer IDs: %', array_length(missing_ids, 1);

    -- Show some sample data
    RAISE NOTICE 'Sample assignment producer IDs: %', assignment_producer_ids[1:3];
    RAISE NOTICE 'Sample producer table IDs: %', producer_ids_in_table[1:3];

END $$;
