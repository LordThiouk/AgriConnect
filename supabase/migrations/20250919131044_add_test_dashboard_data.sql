-- Add test data for dashboard: visits and critical alerts
-- This will populate the dashboard with realistic data

-- First, get the agent profile ID
DO $$
DECLARE
    agent_profile_id UUID;
    test_producer_id UUID;
    test_plot_id UUID;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO agent_profile_id
    FROM public.profiles
    WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
    AND role = 'agent';
    
    IF agent_profile_id IS NOT NULL THEN
        -- Get a producer ID for testing
        SELECT id INTO test_producer_id
        FROM public.producers
        LIMIT 1;
        
        -- Get a plot ID for testing (use plots.id, not farm_file_plots.id)
        SELECT p.id INTO test_plot_id
        FROM public.plots p
        JOIN public.farm_file_plots ffp ON p.id = ffp.plot_id
        JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
        WHERE ff.responsible_producer_id = test_producer_id
        LIMIT 1;
        
        -- Create some test visits for today
        INSERT INTO public.visits (
            agent_id, 
            producer_id, 
            plot_id, 
            visit_date, 
            visit_type, 
            status, 
            duration_minutes, 
            notes, 
            weather_conditions
        ) VALUES 
        (
            agent_profile_id,
            test_producer_id,
            test_plot_id,
            CURRENT_DATE + INTERVAL '2 hours',
            'planned',
            'scheduled',
            45,
            'Visite de suivi des cultures de maïs - vérification irrigation',
            'Ensoleillé'
        ),
        (
            agent_profile_id,
            test_producer_id,
            test_plot_id,
            CURRENT_DATE + INTERVAL '4 hours',
            'follow_up',
            'scheduled',
            30,
            'Contrôle des traitements phytosanitaires',
            'Nuageux'
        )
        ON CONFLICT DO NOTHING;
        
        -- Create some critical observations (alerts) - use farm_file_plots.id for observations
        INSERT INTO public.observations (
            plot_id,
            crop_id,
            observation_date,
            observation_type,
            description,
            severity,
            pest_disease_name,
            affected_area_percent,
            recommendations
        ) VALUES 
        (
            (SELECT ffp.id FROM public.farm_file_plots ffp 
             JOIN public.farm_files ff ON ffp.farm_file_id = ff.id 
             WHERE ff.responsible_producer_id = test_producer_id 
             AND ffp.plot_id = test_plot_id LIMIT 1),
            (SELECT c.id FROM public.crops c 
             JOIN public.farm_file_plots ffp ON c.farm_file_plot_id = ffp.id
             JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
             WHERE ff.responsible_producer_id = test_producer_id 
             AND ffp.plot_id = test_plot_id LIMIT 1),
            CURRENT_DATE - INTERVAL '1 day',
            'ravageur',
            'Attaque sévère de chenilles légionnaires observée sur 60% de la parcelle. Traitement urgent requis.',
            5,
            'Chenilles légionnaires',
            60,
            'Application immédiate d''insecticide à base de Bacillus thuringiensis. Renouveler dans 7 jours si nécessaire.'
        ),
        (
            (SELECT ffp.id FROM public.farm_file_plots ffp 
             JOIN public.farm_files ff ON ffp.farm_file_id = ff.id 
             WHERE ff.responsible_producer_id = test_producer_id 
             AND ffp.plot_id = test_plot_id LIMIT 1),
            (SELECT c.id FROM public.crops c 
             JOIN public.farm_file_plots ffp ON c.farm_file_plot_id = ffp.id
             JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
             WHERE ff.responsible_producer_id = test_producer_id 
             AND ffp.plot_id = test_plot_id LIMIT 1),
            CURRENT_DATE - INTERVAL '2 days',
            'maladie',
            'Taches foliaires de rouille observées sur 25% des plants. Propagation rapide détectée.',
            4,
            'Rouille du maïs',
            25,
            'Traitement fongicide préventif recommandé. Surveiller l''évolution quotidiennement.'
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test data created for agent %', agent_profile_id;
    ELSE
        RAISE NOTICE 'Agent profile not found';
    END IF;
END $$;

-- Verify the data was created
SELECT 
    'Visits' as data_type,
    COUNT(*) as count
FROM public.visits v
JOIN public.profiles p ON v.agent_id = p.id
WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
  AND v.visit_date >= CURRENT_DATE

UNION ALL

SELECT 
    'Critical Observations' as data_type,
    COUNT(*) as count
FROM public.observations o
JOIN public.farm_file_plots ffp ON o.plot_id = ffp.id
JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
JOIN public.agent_producer_assignments apa ON ff.responsible_producer_id = apa.producer_id
JOIN public.profiles p ON apa.agent_id = p.id
WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'
  AND o.severity >= 4
  AND o.created_at >= CURRENT_DATE - INTERVAL '7 days';
