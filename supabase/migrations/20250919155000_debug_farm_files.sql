-- Debug: Vérifier les données dans farm_files
-- This will help us understand why no farm files are found

DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    farm_file_count INT;
    farm_file_with_null_producer INT;
    farm_file_with_valid_producer INT;
    sample_farm_files RECORD;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';

    RAISE NOTICE 'Agent profile ID: %', agent_profile_id;

    -- Count producers assigned to agent
    SELECT COUNT(*) INTO producer_count
    FROM public.agent_producer_assignments
    WHERE agent_id = agent_profile_id;

    RAISE NOTICE 'Producers assigned to agent: %', producer_count;

    -- Count all farm files
    SELECT COUNT(*) INTO farm_file_count
    FROM public.farm_files;

    RAISE NOTICE 'Total farm files in database: %', farm_file_count;

    -- Count farm files with null responsible_producer_id
    SELECT COUNT(*) INTO farm_file_with_null_producer
    FROM public.farm_files
    WHERE responsible_producer_id IS NULL;

    RAISE NOTICE 'Farm files with NULL responsible_producer_id: %', farm_file_with_null_producer;

    -- Count farm files with valid responsible_producer_id
    SELECT COUNT(*) INTO farm_file_with_valid_producer
    FROM public.farm_files
    WHERE responsible_producer_id IS NOT NULL;

    RAISE NOTICE 'Farm files with valid responsible_producer_id: %', farm_file_with_valid_producer;

    -- Show some sample farm files
    RAISE NOTICE 'Sample farm files:';
    FOR sample_farm_files IN 
        SELECT id, name, responsible_producer_id, status
        FROM public.farm_files
        LIMIT 5
    LOOP
        RAISE NOTICE 'Farm file: % - % - Producer: % - Status: %', 
            sample_farm_files.id, 
            sample_farm_files.name, 
            sample_farm_files.responsible_producer_id,
            sample_farm_files.status;
    END LOOP;

    -- Check if any farm files have responsible_producer_id that matches assigned producers
    SELECT COUNT(*) INTO farm_file_count
    FROM public.farm_files ff
    JOIN public.agent_producer_assignments apa ON ff.responsible_producer_id = apa.producer_id
    WHERE apa.agent_id = agent_profile_id;

    RAISE NOTICE 'Farm files matching assigned producers: %', farm_file_count;

END $$;
