-- Fix foreign key constraint for visits.agent_id to point to profiles.id instead of profiles.user_id
-- The mobile app is using profiles.id (the primary key) instead of profiles.user_id

-- First, let's check the current foreign key constraint
DO $$
DECLARE
    constraint_name text;
    constraint_definition text;
BEGIN
    -- Find the foreign key constraint for agent_id
    SELECT conname, pg_get_constraintdef(oid)
    INTO constraint_name, constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'visits'::regclass
    AND conname LIKE '%agent_id%'
    AND contype = 'f';
    
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Current constraint found: %', constraint_name;
        RAISE NOTICE 'Definition: %', constraint_definition;
    ELSE
        RAISE NOTICE 'No foreign key constraint found for agent_id';
    END IF;
END $$;

-- Drop the existing foreign key constraint
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_agent_id_fkey;

-- Update existing visits to use profiles.id instead of profiles.user_id
-- Map user_id to id in the profiles table
UPDATE visits 
SET agent_id = p.id
FROM profiles p
WHERE visits.agent_id = p.user_id;

-- Verify the update worked
DO $$
DECLARE
    updated_count integer;
    remaining_user_ids integer;
BEGIN
    -- Count how many visits were updated
    SELECT COUNT(*)
    INTO updated_count
    FROM visits v
    JOIN profiles p ON v.agent_id = p.id;
    
    -- Count how many visits still have user_id instead of id
    SELECT COUNT(*)
    INTO remaining_user_ids
    FROM visits v
    LEFT JOIN profiles p ON v.agent_id = p.id
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Updated % visits to use profiles.id', updated_count;
    
    IF remaining_user_ids > 0 THEN
        RAISE WARNING 'Still % visits with invalid agent_id references', remaining_user_ids;
    ELSE
        RAISE NOTICE 'All visits now use valid profiles.id references';
    END IF;
END $$;

-- Create a new foreign key constraint pointing to profiles.id (primary key)
-- This ensures that agent_id in visits references the id in profiles
ALTER TABLE visits 
ADD CONSTRAINT visits_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Verify the constraint was created
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'visits'::regclass 
        AND conname = 'visits_agent_id_fkey'
        AND contype = 'f'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Foreign key constraint visits_agent_id_fkey created successfully';
        RAISE NOTICE 'visits.agent_id now references profiles.id';
    ELSE
        RAISE EXCEPTION 'Failed to create foreign key constraint';
    END IF;
END $$;

-- Test the constraint by checking if existing data is valid
DO $$
DECLARE
    invalid_visits_count integer;
BEGIN
    SELECT COUNT(*)
    INTO invalid_visits_count
    FROM visits v
    LEFT JOIN profiles p ON v.agent_id = p.id
    WHERE p.id IS NULL;
    
    IF invalid_visits_count > 0 THEN
        RAISE WARNING 'Found % visits with invalid agent_id references', invalid_visits_count;
    ELSE
        RAISE NOTICE 'All existing visits have valid agent_id references';
    END IF;
END $$;

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT visits_agent_id_fkey ON visits IS 
'Foreign key constraint ensuring visits.agent_id references profiles.id (primary key)';

-- Verify that the constraint works by testing a sample query
DO $$
DECLARE
    test_count integer;
BEGIN
    SELECT COUNT(*)
    INTO test_count
    FROM visits v
    JOIN profiles p ON v.agent_id = p.id
    WHERE p.role = 'agent';
    
    RAISE NOTICE 'Found % visits with valid agent references', test_count;
END $$;