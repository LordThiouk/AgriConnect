-- Fix agent assignments for the correct Auth ID
-- The app uses Auth ID: b00a283f-0a46-41d2-af95-8a256c9c2771
-- We need to find the corresponding profile ID and create assignments

-- First, let's check what we have
DO $$
DECLARE
  agent_profile_id uuid;
  assignment_count integer;
  producer_count integer;
  farm_file_plot_count integer;
BEGIN
  -- Find the profile ID for the Auth ID
  SELECT id INTO agent_profile_id 
  FROM profiles 
  WHERE user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid;
  
  IF agent_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Found profile ID % for Auth ID b00a283f-0a46-41d2-af95-8a256c9c2771', agent_profile_id;
  ELSE
    RAISE NOTICE 'No profile found for Auth ID b00a283f-0a46-41d2-af95-8a256c9c2771';
  END IF;
  
  -- Count existing assignments for this agent
  SELECT COUNT(*) INTO assignment_count 
  FROM agent_producer_assignments apa
  JOIN profiles p ON p.id = apa.agent_id
  WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid;
  
  RAISE NOTICE 'Existing assignments for Auth ID b00a283f-0a46-41d2-af95-8a256c9c2771: %', assignment_count;
END $$;

-- Create assignments for the agent with Auth ID b00a283f-0a46-41d2-af95-8a256c9c2771
INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
SELECT 
  p.id, -- Use the profile ID, not the auth ID
  pr.id,
  now()
FROM profiles p
CROSS JOIN producers pr
WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid
  AND p.role = 'agent'
  AND NOT EXISTS (
    SELECT 1 FROM agent_producer_assignments apa 
    WHERE apa.agent_id = p.id
      AND apa.producer_id = pr.id
  )
LIMIT 5;

-- Create plots for these producers with GPS coordinates
INSERT INTO plots (id, name, producer_id, geom, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Parcelle ' || pr.first_name || ' ' || pr.last_name,
  pr.id,
  ST_SetSRID(ST_MakePoint(
    -17.4441 + (random() - 0.5) * 0.1,  -- Longitude around Dakar
    14.6937 + (random() - 0.5) * 0.1    -- Latitude around Dakar
  ), 4326),
  now(),
  now()
FROM producers pr
WHERE pr.id IN (
  SELECT apa.producer_id FROM agent_producer_assignments apa
  JOIN profiles p ON p.id = apa.agent_id
  WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid
)
AND NOT EXISTS (
  SELECT 1 FROM plots pl WHERE pl.producer_id = pr.id
)
LIMIT 5;

-- Create farm_file_plots linked to the plots we just created
INSERT INTO farm_file_plots (id, producer_id, plot_id, name_season_snapshot, area_hectares, geom, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  pr.id,
  p.id,
  'Parcelle ' || pr.first_name || ' ' || pr.last_name,
  1.0, -- 1 hectare par défaut
  ST_Buffer(p.geom, 0.001), -- Create a small polygon around the point
  now(),
  now()
FROM producers pr
JOIN plots p ON p.producer_id = pr.id
WHERE pr.id IN (
  SELECT apa.producer_id FROM agent_producer_assignments apa
  JOIN profiles prof ON prof.id = apa.agent_id
  WHERE prof.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid
)
AND NOT EXISTS (
  SELECT 1 FROM farm_file_plots ffp WHERE ffp.producer_id = pr.id
)
LIMIT 5;

-- Debug: Let's see what we have after the fix
DO $$
DECLARE
  assignment_count integer;
  producer_count integer;
  farm_file_plot_count integer;
BEGIN
  SELECT COUNT(*) INTO assignment_count FROM agent_producer_assignments apa
  JOIN profiles p ON p.id = apa.agent_id
  WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid;
  
  SELECT COUNT(*) INTO producer_count FROM producers pr
  WHERE pr.id IN (
    SELECT apa.producer_id FROM agent_producer_assignments apa
    JOIN profiles p ON p.id = apa.agent_id
    WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid
  );
  
  SELECT COUNT(*) INTO farm_file_plot_count FROM farm_file_plots ffp
  WHERE ffp.producer_id IN (
    SELECT apa.producer_id FROM agent_producer_assignments apa
    JOIN profiles p ON p.id = apa.agent_id
    WHERE p.user_id = 'b00a283f-0a46-41d2-af95-8a256c9c2771'::uuid
  );
  
  RAISE NOTICE 'After fix - Assignments: %, Producers: %, Farm File Plots: %', 
    assignment_count, producer_count, farm_file_plot_count;
END $$;
