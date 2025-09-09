-- Script pour corriger la contrainte de rôle dans la table profiles
-- À exécuter manuellement dans le SQL Editor de Supabase Dashboard

-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint that supports all user roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin'));

-- Update the handle_new_user function to set a default role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    COALESCE(new.raw_user_meta_data ->> 'role', 'agent') -- Default to 'agent' if no role specified
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to the updated function
COMMENT ON FUNCTION public.handle_new_user() 
IS 'Creates a profile for new users with default role agent if not specified';

-- Create a function to fix existing profiles with invalid roles
CREATE OR REPLACE FUNCTION public.fix_existing_profiles()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  old_role TEXT,
  new_role TEXT,
  fixed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Fix profiles with invalid roles
  FOR profile_record IN 
    SELECT p.user_id, p.role, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.role NOT IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin')
  LOOP
    -- Update invalid role to 'agent' as default
    UPDATE public.profiles 
    SET role = 'agent'
    WHERE user_id = profile_record.user_id;
    
    -- Return the fix information
    user_id := profile_record.user_id;
    email := profile_record.email;
    old_role := profile_record.role;
    new_role := 'agent';
    fixed := TRUE;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.fix_existing_profiles() 
IS 'Fixes existing profiles with invalid roles';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.fix_existing_profiles() TO authenticated;

-- Test the fix by running the function
SELECT * FROM public.fix_existing_profiles();
