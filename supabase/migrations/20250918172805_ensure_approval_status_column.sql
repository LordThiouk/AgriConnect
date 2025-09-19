-- Ensure approval_status column exists in profiles table with proper enum
-- Create the enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_approval_status') THEN
        CREATE TYPE public.user_approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Add approval_status column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status public.user_approval_status DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.approval_status IS 'Status of approval by admin: pending, approved, or rejected';

-- Add index for better performance on filtering by approval status
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- Update existing agents to have 'approved' status by default (assuming they are already working)
UPDATE public.profiles 
SET approval_status = 'approved' 
WHERE role = 'agent' AND approval_status IS NULL;

-- Ensure the enum is properly referenced
ALTER TABLE public.profiles 
ALTER COLUMN approval_status SET DEFAULT 'pending';
