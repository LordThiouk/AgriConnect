-- Migration: Add sample observations data for testing
-- This migration adds sample observations for testing the mobile observations screen

-- Insert sample observations for existing plots
-- First, let's check if we have any farm_file_plots
DO $$
DECLARE
  plot_count INTEGER;
  agent_id UUID;
  sample_plot_id UUID;
  sample_crop_id UUID;
BEGIN
  -- Get agent ID
  SELECT id INTO agent_id FROM profiles WHERE role = 'agent' LIMIT 1;
  
  -- Check if we have any farm_file_plots
  SELECT COUNT(*) INTO plot_count FROM farm_file_plots;
  
  IF plot_count = 0 THEN
    RAISE NOTICE 'No farm_file_plots found. Creating sample data...';
    
    -- Create a sample producer first
    INSERT INTO producers (id, first_name, last_name, phone, village, commune, department, region, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Sample',
      'Producer',
      '+221701234567',
      'Sample Village',
      'Sample Commune',
      'Sample Department',
      'Sample Region',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Create a sample farm_file
    INSERT INTO farm_files (id, responsible_producer_id, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      (SELECT id FROM producers LIMIT 1),
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Create a sample farm_file_plot
    INSERT INTO farm_file_plots (id, farm_file_id, plot_id, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      (SELECT id FROM farm_files LIMIT 1),
      (SELECT id FROM plots LIMIT 1),
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Create assignment
    INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
    VALUES (
      NULL,
      (SELECT id FROM producers LIMIT 1),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Get sample plot and crop IDs
  SELECT ffp.id INTO sample_plot_id FROM farm_file_plots ffp LIMIT 1;
  SELECT id INTO sample_crop_id FROM crops LIMIT 1;
  
  -- Insert observations only if we have valid IDs
  IF sample_plot_id IS NOT NULL AND sample_crop_id IS NOT NULL THEN
    INSERT INTO observations (
      id,
      plot_id,
      crop_id,
      observation_type,
      observation_date,
      description,
      severity,
      pest_disease_name,
      emergence_percent,
      affected_area_percent,
      recommendations,
      observed_by,
      created_at,
      updated_at
    ) VALUES 
    -- Observations critiques (severity >= 4)
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'ravageur',
      NOW() - INTERVAL '2 hours',
      'Attaque sévère de chenilles légionnaires observée sur 60% de la parcelle. Traitement urgent requis.',
      5,
      'Chenilles légionnaires',
      NULL,
      60,
      'Appliquer immédiatement un insecticide à base de spinosad à la dose de 200ml/ha. Renouveler dans 7 jours.',
      NULL,
      NOW() - INTERVAL '2 hours',
      NOW() - INTERVAL '2 hours'
    ),
    -- Observations de fertilisation
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'levée',
      NOW() - INTERVAL '1 day',
      'Levée satisfaisante à 85%. Fertilisation azotée recommandée pour booster la croissance.',
      2,
      NULL,
      85,
      NULL,
      'Appliquer 50kg/ha d''urée en 2 passages : 30kg/ha maintenant et 20kg/ha dans 3 semaines.',
      NULL,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    ),
    -- Observations d'irrigation
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'other',
      NOW() - INTERVAL '3 days',
      'Système d''irrigation goutte-à-goutte fonctionne correctement. Arrosage quotidien maintenu.',
      1,
      NULL,
      NULL,
      NULL,
      'Continuer l''arrosage quotidien de 2L/plante. Surveiller l''humidité du sol.',
      NULL,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days'
    ),
    -- Observations de récolte
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'développement',
      NOW() - INTERVAL '5 days',
      'Épis de maïs bien formés, grains au stade laiteux. Récolte prévue dans 2-3 semaines.',
      2,
      NULL,
      NULL,
      NULL,
      'Préparer la récolte. Vérifier la maturité des grains avant la moisson.',
      NULL,
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '5 days'
    ),
    -- Observation de maladie modérée
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'ravageur',
      NOW() - INTERVAL '1 week',
      'Taches foliaires de rouille observées sur 25% des plants. Traitement préventif nécessaire.',
      3,
      'Rouille du riz',
      NULL,
      25,
      'Appliquer un fongicide à base de propiconazole à la dose de 1L/ha. Renouveler si nécessaire.',
      NULL,
      NOW() - INTERVAL '1 week',
      NOW() - INTERVAL '1 week'
    ),
    -- Observation de fertilisation avancée
    (
      gen_random_uuid(),
      sample_plot_id,
      sample_crop_id,
      'levée',
      NOW() - INTERVAL '2 weeks',
      'Plants de tomates vigoureux. Fertilisation phosphatée appliquée avec succès.',
      1,
      NULL,
      95,
      NULL,
      'Maintenir la fertilisation équilibrée. Surveiller les carences en potassium.',
      NULL,
      NOW() - INTERVAL '2 weeks',
      NOW() - INTERVAL '2 weeks'
    );
    
    RAISE NOTICE 'Sample observations inserted successfully';
  ELSE
    RAISE NOTICE 'No valid plot or crop found. Skipping observations insertion.';
  END IF;
END $$;

-- Note: Status tracking will be handled in the application layer
-- The observations are inserted with different severity levels to simulate different statuses