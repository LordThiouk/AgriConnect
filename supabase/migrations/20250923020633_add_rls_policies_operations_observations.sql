-- Add RLS policies for operations and observations to allow frontend display
-- This allows anonymous users to read operations and observations for display purposes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "operations_select_owner_admin" ON public.operations;
DROP POLICY IF EXISTS "observations_select_owner_admin" ON public.observations;

-- Create public read policies for operations
CREATE POLICY "operations_public_read" ON public.operations
FOR SELECT USING (true);

-- Create public read policies for observations  
CREATE POLICY "observations_public_read" ON public.observations
FOR SELECT USING (true);

-- Keep restrictive policies for write operations (drop first if they exist)
DROP POLICY IF EXISTS "operations_insert_owner" ON public.operations;
DROP POLICY IF EXISTS "operations_update_owner_admin" ON public.operations;
DROP POLICY IF EXISTS "operations_delete_owner_admin" ON public.operations;

DROP POLICY IF EXISTS "observations_insert_owner" ON public.observations;
DROP POLICY IF EXISTS "observations_update_owner_admin" ON public.observations;
DROP POLICY IF EXISTS "observations_delete_owner_admin" ON public.observations;

-- Create restrictive write policies for operations
CREATE POLICY "operations_insert_owner" ON public.operations
FOR INSERT WITH CHECK (performer_id = auth.uid());

CREATE POLICY "operations_update_owner_admin" ON public.operations
FOR UPDATE USING (
  performer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

CREATE POLICY "operations_delete_owner_admin" ON public.operations
FOR DELETE USING (
  performer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

-- Create restrictive write policies for observations
CREATE POLICY "observations_insert_owner" ON public.observations
FOR INSERT WITH CHECK (observed_by = auth.uid());

CREATE POLICY "observations_update_owner_admin" ON public.observations
FOR UPDATE USING (
  observed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

CREATE POLICY "observations_delete_owner_admin" ON public.observations
FOR DELETE USING (
  observed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

-- Add comments
COMMENT ON POLICY "operations_public_read" ON public.operations IS 'Permet la lecture publique des opérations pour affichage frontend';
COMMENT ON POLICY "observations_public_read" ON public.observations IS 'Permet la lecture publique des observations pour affichage frontend';
