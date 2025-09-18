-- Add DELETE policy for cooperatives table
-- Allow admins and supervisors to delete cooperatives

-- Enable RLS on cooperatives table if not already enabled
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Admins and supervisors can delete cooperatives" ON public.cooperatives;

-- Create DELETE policy for cooperatives
CREATE POLICY "Admins and supervisors can delete cooperatives"
ON public.cooperatives
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
);

-- Note: The cooperatives table doesn't have a created_by column
-- So we only allow admins and supervisors to delete cooperatives
