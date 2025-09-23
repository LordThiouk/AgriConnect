-- Fix RLS policies to allow frontend display of producer statistics
-- This allows anonymous users to read basic producer information and farm files count

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "farm_files_select_owner_admin" ON public.farm_files;
DROP POLICY IF EXISTS "farm_file_plots_select_owner_admin" ON public.farm_file_plots;

-- Create new policies that allow public read access for display purposes
CREATE POLICY "farm_files_public_read" ON public.farm_files
FOR SELECT USING (true);

CREATE POLICY "farm_file_plots_public_read" ON public.farm_file_plots  
FOR SELECT USING (true);

-- Keep the restrictive policies for write operations (drop first if they exist)
DROP POLICY IF EXISTS "farm_files_insert_owner" ON public.farm_files;
DROP POLICY IF EXISTS "farm_files_update_owner_admin" ON public.farm_files;

CREATE POLICY "farm_files_insert_owner" ON public.farm_files
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "farm_files_update_owner_admin" ON public.farm_files
FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

-- Ensure producers table allows public read for basic info
DROP POLICY IF EXISTS "Agents can read their assigned producers" ON public.producers;
DROP POLICY IF EXISTS "producers_select_owner_admin" ON public.producers;

CREATE POLICY "producers_public_read" ON public.producers
FOR SELECT USING (true);

-- Keep write restrictions
CREATE POLICY "producers_insert_admin" ON public.producers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

CREATE POLICY "producers_update_admin" ON public.producers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);
