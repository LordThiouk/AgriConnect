-- Fix RLS permissions for producers table
-- The issue is likely that agents can't read producers due to RLS

-- Check current RLS policies on producers
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'producers';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view producers" ON public.producers;
DROP POLICY IF EXISTS "Agents can view assigned producers" ON public.producers;

-- Create new RLS policy for producers
CREATE POLICY "Agents can view assigned producers" ON public.producers
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT apa.producer_id
            FROM public.agent_producer_assignments apa
            JOIN public.profiles p ON apa.agent_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.role = 'agent'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.producers TO authenticated;
