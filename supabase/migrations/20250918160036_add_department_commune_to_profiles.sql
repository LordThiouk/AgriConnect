-- Add department and commune columns to profiles table
-- This will allow agents to have department and commune information

-- Add department column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN department text;

-- Add commune column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN commune text;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.department IS 'Department where the user is located';
COMMENT ON COLUMN public.profiles.commune IS 'Commune where the user is located';

-- Add indexes for better performance on filtering
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_commune ON public.profiles(commune);
CREATE INDEX idx_profiles_region_department ON public.profiles(region, department);

-- Update the handle_new_user function to include department and commune
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple profile creation without any complex logic
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    role, 
    phone, 
    is_active, 
    department,
    commune,
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    'Utilisateur Mobile',
    'agent',
    new.phone,
    true,  -- New users are active by default
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'commune',
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

-- Add comments
COMMENT ON COLUMN public.profiles.department IS 'Department where the user is located';
COMMENT ON COLUMN public.profiles.commune IS 'Commune where the user is located';
