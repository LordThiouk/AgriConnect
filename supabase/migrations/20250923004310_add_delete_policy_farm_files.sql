-- Add DELETE policy for farm_files table
-- This allows users to delete farm files they created or admins/supervisors to delete any farm file

CREATE POLICY "farm_files_delete_owner_admin" ON public.farm_files
FOR DELETE USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);
