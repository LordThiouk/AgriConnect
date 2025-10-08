-- Fix foreign key constraint for visits.agent_id
-- The constraint currently points to a non-existent "users" table
-- We need to point it to profiles.user_id instead

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

-- Drop the existing foreign key constraint if it exists
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_agent_id_fkey;

-- Create a new foreign key constraint pointing to profiles.user_id
-- This ensures that agent_id in visits references the user_id in profiles
ALTER TABLE visits 
ADD CONSTRAINT visits_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES profiles(user_id) 
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
        RAISE NOTICE 'visits.agent_id now references profiles.user_id';
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
    LEFT JOIN profiles p ON v.agent_id = p.user_id
    WHERE p.user_id IS NULL;
    
    IF invalid_visits_count > 0 THEN
        RAISE WARNING 'Found % visits with invalid agent_id references', invalid_visits_count;
    ELSE
        RAISE NOTICE 'All existing visits have valid agent_id references';
    END IF;
END $$;

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT visits_agent_id_fkey ON visits IS 
'Foreign key constraint ensuring visits.agent_id references profiles.user_id';

-- Verify that the constraint works by testing a sample query
DO $$
DECLARE
    test_count integer;
BEGIN
    SELECT COUNT(*)
    INTO test_count
    FROM visits v
    JOIN profiles p ON v.agent_id = p.user_id
    WHERE p.role = 'agent';
    
    RAISE NOTICE 'Found % visits with valid agent references', test_count;
END $$;
