-- Fix RLS policies for participants table  
-- Similar to the visits fix: policies use auth.uid() but we need to check against profiles.id
-- where profiles.user_id = auth.uid() and profiles.role = 'agent'

-- Drop existing policies
DROP POLICY IF EXISTS "Agents can insert participants for their plots" ON public.participants;
DROP POLICY IF EXISTS "Agents can select participants for their plots" ON public.participants;
DROP POLICY IF EXISTS "Agents can update participants for their plots" ON public.participants;
DROP POLICY IF EXISTS "Agents can delete participants for their plots" ON public.participants;
DROP POLICY IF EXISTS "Admins and supervisors can access all participants" ON public.participants;

-- Create new policies that work with the actual data structure
-- Policy: Agents can insert participants for their plots
CREATE POLICY "Agents can insert participants for their plots"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.id = participants.plot_id
    AND ff.created_by = (
      SELECT p.id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'agent'
    )
  )
);

-- Policy: Agents can select participants for their plots
CREATE POLICY "Agents can select participants for their plots"
ON public.participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.id = participants.plot_id
    AND ff.created_by = (
      SELECT p.id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'agent'
    )
  )
);

-- Policy: Agents can update participants for their plots
CREATE POLICY "Agents can update participants for their plots"
ON public.participants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.id = participants.plot_id
    AND ff.created_by = (
      SELECT p.id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'agent'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.id = participants.plot_id
    AND ff.created_by = (
      SELECT p.id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'agent'
    )
  )
);

-- Policy: Agents can delete participants for their plots
CREATE POLICY "Agents can delete participants for their plots"
ON public.participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.id = participants.plot_id
    AND ff.created_by = (
      SELECT p.id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'agent'
    )
  )
);

-- Policy: Admins and supervisors can access all participants
CREATE POLICY "Admins and supervisors can access all participants"
ON public.participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'supervisor')
  )
);
