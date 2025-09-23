-- Fix RLS permissions for agent_producer_assignments
-- The issue is likely that the RLS policy doesn't allow the agent to read their own assignments

-- First, let's check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agent_producer_assignments';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view their own assignments" ON public.agent_producer_assignments;
DROP POLICY IF EXISTS "Agents can insert their own assignments" ON public.agent_producer_assignments;

-- Create new RLS policies for agent_producer_assignments
CREATE POLICY "Agents can view their own assignments" ON public.agent_producer_assignments
    FOR SELECT
    TO authenticated
    USING (
        agent_id IN (
            SELECT id 
            FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'agent'
        )
    );

CREATE POLICY "Agents can insert their own assignments" ON public.agent_producer_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id IN (
            SELECT id 
            FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'agent'
        )
    );

-- Also ensure the table has RLS enabled
ALTER TABLE public.agent_producer_assignments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.agent_producer_assignments TO authenticated;
