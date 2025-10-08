-- Fix RLS policies for visits table
-- The issue is that RLS policies use auth.uid() but we need to check against profiles.id
-- where profiles.user_id = auth.uid() and profiles.role = 'agent'

-- Drop existing policies
DROP POLICY IF EXISTS "Agents can view their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can create their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can insert their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can update their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can delete their own visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and Admins can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can update visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can delete visits" ON public.visits;

-- Create new policies that work with the actual data structure
-- Policy: Agents can view their own visits
CREATE POLICY "Agents can view their own visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  )
);

-- Policy: Agents can insert their own visits
CREATE POLICY "Agents can insert their own visits"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  )
);

-- Policy: Agents can update their own visits
CREATE POLICY "Agents can update their own visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  )
)
WITH CHECK (
  agent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  )
);

-- Policy: Agents can delete their own visits
CREATE POLICY "Agents can delete their own visits"
ON public.visits
FOR DELETE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'agent'
  )
);

-- Policy: Supervisors and admins can view all visits
CREATE POLICY "Supervisors and admins can view all visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);

-- Policy: Supervisors and admins can insert visits
CREATE POLICY "Supervisors and admins can insert visits"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);

-- Policy: Supervisors and admins can update visits
CREATE POLICY "Supervisors and admins can update visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);

-- Policy: Supervisors and admins can delete visits
CREATE POLICY "Supervisors and admins can delete visits"
ON public.visits
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  )
);
