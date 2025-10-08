-- Fix RLS policies for visits table to allow agents to access their own visits
-- This migration ensures that authenticated agents can read and update their own visits

-- Enable RLS on visits table if not already enabled
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "agents_can_view_their_visits" ON visits;
DROP POLICY IF EXISTS "agents_can_update_their_visits" ON visits;
DROP POLICY IF EXISTS "agents_can_insert_visits" ON visits;
DROP POLICY IF EXISTS "agents_can_delete_their_visits" ON visits;

-- Create comprehensive RLS policies for visits table

-- Policy 1: Agents can view their own visits
CREATE POLICY "agents_can_view_their_visits" 
ON visits FOR SELECT 
TO authenticated 
USING (
  agent_id = auth.uid() OR 
  agent_id IN (
    SELECT user_id FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  )
);

-- Policy 2: Agents can update their own visits
CREATE POLICY "agents_can_update_their_visits" 
ON visits FOR UPDATE 
TO authenticated 
USING (
  agent_id = auth.uid() OR 
  agent_id IN (
    SELECT user_id FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  )
)
WITH CHECK (
  agent_id = auth.uid() OR 
  agent_id IN (
    SELECT user_id FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  )
);

-- Policy 3: Agents can insert new visits
CREATE POLICY "agents_can_insert_visits" 
ON visits FOR INSERT 
TO authenticated 
WITH CHECK (
  agent_id = auth.uid() OR 
  agent_id IN (
    SELECT user_id FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  )
);

-- Policy 4: Agents can delete their own visits (optional)
CREATE POLICY "agents_can_delete_their_visits" 
ON visits FOR DELETE 
TO authenticated 
USING (
  agent_id = auth.uid() OR 
  agent_id IN (
    SELECT user_id FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  )
);

-- Policy 5: Supervisors and admins can view all visits
CREATE POLICY "supervisors_can_view_all_visits" 
ON visits FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);

-- Policy 6: Supervisors and admins can update all visits
CREATE POLICY "supervisors_can_update_all_visits" 
ON visits FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);

-- Add comments for documentation
COMMENT ON POLICY "agents_can_view_their_visits" ON visits IS 
'Allows authenticated agents to view visits assigned to them';

COMMENT ON POLICY "agents_can_update_their_visits" ON visits IS 
'Allows authenticated agents to update visits assigned to them';

COMMENT ON POLICY "agents_can_insert_visits" ON visits IS 
'Allows authenticated agents to create new visits';

COMMENT ON POLICY "agents_can_delete_their_visits" ON visits IS 
'Allows authenticated agents to delete visits assigned to them';

COMMENT ON POLICY "supervisors_can_view_all_visits" ON visits IS 
'Allows supervisors and admins to view all visits';

COMMENT ON POLICY "supervisors_can_update_all_visits" ON visits IS 
'Allows supervisors and admins to update all visits';

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'visits' 
    AND relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on visits table';
  END IF;
  
  RAISE NOTICE 'RLS policies for visits table have been successfully created';
END $$;
