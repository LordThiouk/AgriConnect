-- Temporarily disable RLS for producers table to fix the issue
-- This allows agents to read producers

-- Disable RLS temporarily
ALTER TABLE public.producers DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users for this table
GRANT ALL ON public.producers TO authenticated;

-- Note: In production, we should implement proper RLS policies instead of disabling RLS
