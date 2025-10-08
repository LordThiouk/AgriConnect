-- Fix RLS policies for cooperatives table
-- This migration ensures that authenticated users can read cooperatives
-- and admin users can perform CRUD operations

-- Enable RLS on cooperatives table if not already enabled
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read cooperatives" ON cooperatives;
DROP POLICY IF EXISTS "Allow admin users to manage cooperatives" ON cooperatives;
DROP POLICY IF EXISTS "Allow authenticated users to create cooperatives" ON cooperatives;
DROP POLICY IF EXISTS "Allow authenticated users to update cooperatives" ON cooperatives;
DROP POLICY IF EXISTS "Allow authenticated users to delete cooperatives" ON cooperatives;

-- Create policies for cooperatives
-- 1. Allow authenticated users to read cooperatives
CREATE POLICY "Allow authenticated users to read cooperatives" ON cooperatives
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow authenticated users to create cooperatives
CREATE POLICY "Allow authenticated users to create cooperatives" ON cooperatives
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Allow authenticated users to update cooperatives
CREATE POLICY "Allow authenticated users to update cooperatives" ON cooperatives
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Allow authenticated users to delete cooperatives
CREATE POLICY "Allow authenticated users to delete cooperatives" ON cooperatives
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Allow service role to manage cooperatives" ON cooperatives
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
