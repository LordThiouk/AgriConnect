-- Add is_active column to profiles table
-- This will allow agents to be marked as active or inactive

-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user profile is active or inactive';

-- Update existing profiles to be active by default
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.profiles 
ALTER COLUMN is_active SET NOT NULL;

-- Add index for better performance on filtering
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Add index for role and is_active combination
CREATE INDEX idx_profiles_role_active ON public.profiles(role, is_active);

-- Update the handle_new_user function to include is_active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple profile creation without any complex logic
  INSERT INTO public.profiles (user_id, display_name, role, phone, is_active, created_at, updated_at)
  VALUES (
    new.id, 
    'Utilisateur Mobile',
    'agent',
    new.phone,
    true,  -- New users are active by default
    now(),
    now()
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, don't block user creation
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Add comment
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user profile is active (true) or inactive (false)';
