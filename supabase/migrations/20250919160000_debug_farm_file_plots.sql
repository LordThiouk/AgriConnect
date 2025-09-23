-- Debug: Vérifier les parcelles dans farm_file_plots avec producer_id
-- This will help us understand if plots exist with producer_id

DO $$
DECLARE
    agent_profile_id UUID;
    producer_count INT;
    farm_file_plot_count INT;
    farm_file_plot_with_producer_id INT;
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

    -- Count all farm_file_plots
    SELECT COUNT(*) INTO farm_file_plot_count
    FROM public.farm_file_plots;

    RAISE NOTICE 'Total farm_file_plots in database: %', farm_file_plot_count;

    -- Count farm_file_plots with producer_id
    SELECT COUNT(*) INTO farm_file_plot_with_producer_id
    FROM public.farm_file_plots
    WHERE producer_id IS NOT NULL;

    RAISE NOTICE 'Farm_file_plots with producer_id: %', farm_file_plot_with_producer_id;

    -- Show some sample plots
    RAISE NOTICE 'Sample farm_file_plots:';
    FOR sample_plots IN 
        SELECT id, name_season_snapshot, area_hectares, producer_id
        FROM public.farm_file_plots
        WHERE producer_id IS NOT NULL
        LIMIT 5
    LOOP
        RAISE NOTICE 'Plot: % - % (% ha) - Producer: %', 
            sample_plots.id, 
            sample_plots.name_season_snapshot, 
            sample_plots.area_hectares,
            sample_plots.producer_id;
    END LOOP;

    -- Check if any farm_file_plots have producer_id that matches assigned producers
    SELECT COUNT(*) INTO farm_file_plot_count
    FROM public.farm_file_plots ffp
    JOIN public.agent_producer_assignments apa ON ffp.producer_id = apa.producer_id
    WHERE apa.agent_id = agent_profile_id;

    RAISE NOTICE 'Farm_file_plots matching assigned producers: %', farm_file_plot_count;

END $$;
