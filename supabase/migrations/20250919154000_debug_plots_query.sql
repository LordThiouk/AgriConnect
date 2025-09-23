-- Debug: Vérifier les parcelles dans farm_file_plots
-- This will help us understand if plots exist and are linked to producers

DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    farm_file_count INT;
    farm_file_plot_count INT;
    sample_plots RECORD;
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

    -- Count farm files for these producers
    SELECT COUNT(*) INTO farm_file_count
    FROM public.farm_files ff
    JOIN public.agent_producer_assignments apa ON ff.responsible_producer_id = apa.producer_id
    WHERE apa.agent_id = agent_profile_id;

    RAISE NOTICE 'Farm files for assigned producers: %', farm_file_count;

    -- Count farm_file_plots for these farm files
    SELECT COUNT(*) INTO farm_file_plot_count
    FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    JOIN public.agent_producer_assignments apa ON ff.responsible_producer_id = apa.producer_id
    WHERE apa.agent_id = agent_profile_id;

    RAISE NOTICE 'Farm file plots for assigned producers: %', farm_file_plot_count;

    -- Show some sample plots
    RAISE NOTICE 'Sample plots:';
    FOR sample_plots IN 
        SELECT ffp.id, ffp.name_season_snapshot, ffp.area_hectares, 
               p.first_name, p.last_name
        FROM public.farm_file_plots ffp
        JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
        JOIN public.producers p ON ff.responsible_producer_id = p.id
        JOIN public.agent_producer_assignments apa ON p.id = apa.producer_id
        WHERE apa.agent_id = agent_profile_id
        LIMIT 3
    LOOP
        RAISE NOTICE 'Plot: % - % (% ha) - Producer: % %', 
            sample_plots.id, 
            sample_plots.name_season_snapshot, 
            sample_plots.area_hectares,
            sample_plots.first_name,
            sample_plots.last_name;
    END LOOP;

END $$;
