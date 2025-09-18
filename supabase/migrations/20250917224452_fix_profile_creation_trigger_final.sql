-- Final fix for profile creation trigger - ensures it runs after disable migration
-- This migration re-enables automatic profile creation for mobile OTP registration

-- First, ensure the trigger is completely removed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a robust handle_new_user function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
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
      COALESCE(
        new.raw_user_meta_data ->> 'role', 
        'agent'  -- Default role for mobile users
      ),
      new.phone,  -- Sync phone from auth.users
      now(),
      now()
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created successfully for user % with role %', 
      new.id, 
      COALESCE(new.raw_user_meta_data ->> 'role', 'agent');
      
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

-- Create the trigger to automatically create profiles on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a profile when a new user signs up via OTP. Includes error handling to prevent blocking user creation.';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Fix any existing users without profiles
DO $$
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Count users without profiles
  SELECT COUNT(*) INTO profile_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL;
  
  RAISE NOTICE 'Found % users without profiles, creating them...', profile_count;
  
  -- Create profiles for users without them
  FOR user_record IN 
    SELECT u.id, u.email, u.phone
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (user_id, display_name, role, phone, created_at, updated_at)
      VALUES (
        user_record.id, 
        'Utilisateur Mobile', 
        'agent',
        user_record.phone,
        now(),
        now()
      );
      
      RAISE NOTICE 'Created profile for user %', user_record.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Profile creation process completed';
END $$;
