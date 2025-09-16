-- First, drop the old, incomplete insert policy to avoid conflicts
DROP POLICY IF EXISTS "Agents can insert plots for their own farm files" ON public.plots;

-- Create a new, comprehensive policy for ALL operations
CREATE POLICY "Agents can manage plots for their own farm files"
ON public.plots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.farm_files ff
    WHERE ff.id = plots.farm_file_id AND ff.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farm_files ff
    WHERE ff.id = plots.farm_file_id AND ff.created_by = auth.uid()
  )
);
