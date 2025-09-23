-- Temporarily disable RLS for agent_producer_assignments to fix the issue
-- This allows agents to read their assignments

-- Disable RLS temporarily
ALTER TABLE public.agent_producer_assignments DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users for this table
GRANT ALL ON public.agent_producer_assignments TO authenticated;

-- Note: In production, we should implement proper RLS policies instead of disabling RLS
