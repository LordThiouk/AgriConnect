-- Fix agent-producer assignments issue
-- Create test data for agent 0f33842a-a1f1-4ad5-8113-39285e5013df

-- First, let's ensure we have some producers in the system
INSERT INTO producers (id, profile_id, first_name, last_name, phone, village, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.user_id,
  'Producteur',
  'Test ' || COALESCE(p.display_name, 'Utilisateur'),
  '+22177123456' || (ROW_NUMBER() OVER (ORDER BY p.id)),
  'Village Test',
  now(),
  now()
FROM profiles p
WHERE p.role = 'producer'
  AND NOT EXISTS (
    SELECT 1 FROM producers pr WHERE pr.profile_id = p.user_id
  )
LIMIT 3;

-- Now, let's create some assignments for the agent
-- Use the correct agent ID: 0f33842a-a1f1-4ad5-8113-39285e5013df
INSERT INTO agent_producer_assignments (agent_id, producer_id, assigned_at)
SELECT 
  '0f33842a-a1f1-4ad5-8113-39285e5013df'::uuid,
  pr.id,
  now()
FROM producers pr
WHERE NOT EXISTS (
  SELECT 1 FROM agent_producer_assignments apa 
  WHERE apa.agent_id = '0f33842a-a1f1-4ad5-8113-39285e5013df'::uuid
    AND apa.producer_id = pr.id
)
LIMIT 3;

-- Debug: Let's see what we have
DO $$
DECLARE
  assignment_count integer;
  producer_count integer;
BEGIN
  SELECT COUNT(*) INTO assignment_count FROM agent_producer_assignments WHERE agent_id = '0f33842a-a1f1-4ad5-8113-39285e5013df'::uuid;
  SELECT COUNT(*) INTO producer_count FROM producers WHERE id IN (SELECT producer_id FROM agent_producer_assignments WHERE agent_id = '0f33842a-a1f1-4ad5-8113-39285e5013df'::uuid);
  
  RAISE NOTICE 'Assignments: %, Producers: %', assignment_count, producer_count;
END $$;