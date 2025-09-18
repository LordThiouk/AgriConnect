-- Re-enable automatic profile creation trigger for mobile OTP registration
-- This fixes the "Database error saving new user" issue by ensuring profiles
-- are automatically created when users sign up via OTP

-- Create a robust handle_new_user function with proper error handling
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

-- Create a function to fix existing users without profiles
CREATE OR REPLACE FUNCTION public.fix_users_without_profiles()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  phone TEXT,
  profile_created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.phone
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    -- Create profile for user
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
      
      -- Return success
      user_id := user_record.id;
      email := user_record.email;
      phone := user_record.phone;
      profile_created := TRUE;
      
      RETURN NEXT;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Return failure
        user_id := user_record.id;
        email := user_record.email;
        phone := user_record.phone;
        profile_created := FALSE;
        
        RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Grant permissions for the fix function
GRANT EXECUTE ON FUNCTION public.fix_users_without_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION public.fix_users_without_profiles() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.fix_users_without_profiles() IS 
'Fixes existing users who don''t have profiles by creating them with default values';
