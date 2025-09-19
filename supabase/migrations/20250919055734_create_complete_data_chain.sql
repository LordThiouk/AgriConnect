-- Migration: Create complete data chain for observations
-- This migration creates all necessary data to make observations visible to the agent

DO $$
DECLARE
  current_agent_id UUID;
  sample_producer_id UUID;
  sample_cooperative_id UUID;
  sample_farm_file_id UUID;
  sample_plot_id UUID;
  sample_farm_file_plot_id UUID;
  sample_crop_id UUID;
  sample_season_id UUID;
BEGIN
  -- Get the current agent ID
  SELECT id INTO current_agent_id FROM profiles WHERE role = 'agent' LIMIT 1;
  
  -- Get or create a cooperative
  SELECT id INTO sample_cooperative_id FROM cooperatives LIMIT 1;
  
  IF sample_cooperative_id IS NULL THEN
    INSERT INTO cooperatives (id, name, region, department, commune, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Coopérative de Test',
      'Test Region',
      'Test Department',
      'Test Commune',
      NOW(),
      NOW()
    ) RETURNING id INTO sample_cooperative_id;
  END IF;
  
  -- Get or create a producer
  SELECT id INTO sample_producer_id FROM producers LIMIT 1;
  
  IF sample_producer_id IS NULL THEN
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
    ) RETURNING id INTO sample_producer_id;
  END IF;
  
  -- Create farm_file
  INSERT INTO farm_files (
    id, 
    name, 
    responsible_producer_id, 
    census_date,
    commune,
    cooperative_id,
    created_by,
    department,
    region,
    sector,
    status,
    village,
    created_at, 
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Fiche de Test',
    sample_producer_id,
    CURRENT_DATE,
    'Sample Commune',
    sample_cooperative_id,
    current_agent_id,
    'Sample Department',
    'Sample Region',
    'Sample Sector',
    'draft',
    'Sample Village',
    NOW(),
    NOW()
  ) RETURNING id INTO sample_farm_file_id;
  
  -- Create plot
  INSERT INTO plots (id, name, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Parcelle de Test',
    NOW(),
    NOW()
  ) RETURNING id INTO sample_plot_id;
  
  -- Create farm_file_plot
  INSERT INTO farm_file_plots (
    id, 
    farm_file_id, 
    plot_id, 
    producer_id,
    name_season_snapshot,
    area_hectares,
    soil_type,
    status,
    created_at, 
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    sample_farm_file_id,
    sample_plot_id,
    sample_producer_id,
    'Saison Test',
    2.5,
    'sandy',
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO sample_farm_file_plot_id;
  
  -- Get or create a season
  SELECT id INTO sample_season_id FROM seasons WHERE is_active = true LIMIT 1;
  
  IF sample_season_id IS NULL THEN
    INSERT INTO seasons (id, name, start_date, end_date, is_active, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Saison 2024-2025',
      CURRENT_DATE - INTERVAL '6 months',
      CURRENT_DATE + INTERVAL '6 months',
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO sample_season_id;
  END IF;
  
  -- Create crop
  INSERT INTO crops (
    id, 
    farm_file_plot_id, 
    season_id, 
    crop_type, 
    variety, 
    sowing_date, 
    status, 
    created_at, 
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    sample_farm_file_plot_id,
    sample_season_id,
    'Maize',
    'Variété Test',
    CURRENT_DATE - INTERVAL '30 days',
    'en_cours',
    NOW(),
    NOW()
  ) RETURNING id INTO sample_crop_id;
  
  -- Create agent-producer assignment
  INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
  VALUES (
    current_agent_id,
    sample_producer_id,
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  -- Update existing observations to use the correct plot_id and crop_id
  UPDATE observations 
  SET plot_id = sample_farm_file_plot_id,
      crop_id = sample_crop_id
  WHERE plot_id NOT IN (
    SELECT id FROM farm_file_plots
  );
  
  RAISE NOTICE 'Complete data chain created successfully';
  RAISE NOTICE 'Agent ID: %', current_agent_id;
  RAISE NOTICE 'Producer ID: %', sample_producer_id;
  RAISE NOTICE 'Farm File ID: %', sample_farm_file_id;
  RAISE NOTICE 'Plot ID: %', sample_plot_id;
  RAISE NOTICE 'Farm File Plot ID: %', sample_farm_file_plot_id;
  RAISE NOTICE 'Crop ID: %', sample_crop_id;
END $$;
