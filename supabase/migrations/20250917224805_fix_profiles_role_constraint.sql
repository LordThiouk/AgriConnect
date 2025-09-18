-- Fix profiles table role constraint to use proper enum type
-- This should resolve the "Database error saving new user" issue

-- First, let's check the current constraint and fix it
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the proper constraint using the user_role enum
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin'));

-- Update the handle_new_user function to ensure it uses valid enum values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role text;
BEGIN
  -- Determine the role with proper validation
  user_role := COALESCE(
    new.raw_user_meta_data ->> 'role', 
    'agent'  -- Default role for mobile users
  );
  
  -- Validate the role is in the allowed enum values
  IF user_role NOT IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin') THEN
    user_role := 'agent';  -- Fallback to agent if invalid
  END IF;
  
  -- Insert profile with comprehensive error handling
  BEGIN
    INSERT INTO public.profiles (
      user_id, 
      display_name, 
      role,
      phone,
      created_at,
      updated_at
    )
    VALUES (
      new.id, 
      COALESCE(
        new.raw_user_meta_data ->> 'display_name', 
        new.raw_user_meta_data ->> 'full_name',
        'Utilisateur Mobile'
      ),
      user_role,
      new.phone,  -- Sync phone from auth.users
      now(),
      now()
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created successfully for user % with role %', 
      new.id, user_role;
      
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, just update phone if needed
      UPDATE public.profiles 
      SET phone = new.phone,
          updated_at = now()
      WHERE user_id = new.id;
      
      RAISE NOTICE 'Profile already exists for user %, updated phone', new.id;
      
    WHEN OTHERS THEN
      -- Log error but don't block user creation
      RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
      
      -- Try to create a minimal profile as fallback
      BEGIN
        INSERT INTO public.profiles (user_id, display_name, role, created_at, updated_at)
        VALUES (new.id, 'Utilisateur Mobile', 'agent', now(), now());
        RAISE NOTICE 'Fallback profile created for user %', new.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to create fallback profile for user %: %', new.id, SQLERRM;
      END;
  END;
  
  RETURN new;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Fix any existing profiles with invalid roles
UPDATE public.profiles 
SET role = 'agent'
WHERE role IS NULL OR role NOT IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin');

-- Add comment
COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS 
'Ensures role field uses valid enum values from user_role enum';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
