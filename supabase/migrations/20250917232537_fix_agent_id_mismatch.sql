-- Fix agent ID mismatch issue
-- Create assignments for any existing agent

-- Create assignments for any existing agent
INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
SELECT 
  p.id,
  pr.id,
  now()
FROM profiles p
CROSS JOIN producers pr
WHERE p.role = 'agent'
  AND NOT EXISTS (
    SELECT 1 FROM agent_producer_assignments apa 
    WHERE apa.agent_id = p.id
      AND apa.producer_id = pr.id
  )
LIMIT 3;

-- Create some plots for these producers with GPS coordinates
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
  SELECT producer_id FROM agent_producer_assignments 
  WHERE agent_id IN (SELECT id FROM profiles WHERE role = 'agent')
)
AND NOT EXISTS (
  SELECT 1 FROM plots p WHERE p.producer_id = pr.id
)
LIMIT 3;

-- Debug: Let's see what we have
DO $$
DECLARE
  assignment_count integer;
  producer_count integer;
  plot_count integer;
BEGIN
  SELECT COUNT(*) INTO assignment_count FROM agent_producer_assignments;
  SELECT COUNT(*) INTO producer_count FROM producers WHERE id IN (SELECT producer_id FROM agent_producer_assignments);
  SELECT COUNT(*) INTO plot_count FROM plots WHERE producer_id IN (SELECT producer_id FROM agent_producer_assignments);
  
  RAISE NOTICE 'Assignments: %, Producers: %, Plots: %', 
    assignment_count, producer_count, plot_count;
END $$;