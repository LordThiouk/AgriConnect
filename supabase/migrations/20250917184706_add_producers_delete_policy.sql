-- Add DELETE policy for producers table
-- This allows admins, supervisors, and the producer themselves to delete producers

CREATE POLICY "Producers can be deleted by admins, supervisors and themselves" ON public.producers
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    profile_id = auth.uid() -- Producers can delete their own profile
  );

-- Add comment for documentation
COMMENT ON POLICY "Producers can be deleted by admins, supervisors and themselves" ON public.producers 
IS 'Allows deletion of producers by admins, supervisors, and the producer themselves';
