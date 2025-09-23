-- Add simple DELETE policy for farm_files table (temporary for testing)
-- This allows public deletion of farm files

DROP POLICY IF EXISTS "farm_files_delete_owner_admin" ON public.farm_files;

CREATE POLICY "farm_files_public_delete" ON public.farm_files
FOR DELETE USING (true);
