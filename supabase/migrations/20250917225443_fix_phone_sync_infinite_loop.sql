-- Fix infinite loop between phone sync triggers
-- The issue: sync_phone_trigger (auth.users) -> profiles.phone -> sync_phone_from_profiles_trigger -> auth.users.phone -> infinite loop

-- Remove the problematic bidirectional sync triggers
DROP TRIGGER IF EXISTS sync_phone_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_from_profiles_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_phone_from_auth();
DROP FUNCTION IF EXISTS sync_phone_to_auth();

-- Create a simple one-way sync from auth.users to profiles only
-- This prevents the infinite loop while still syncing phone numbers
CREATE OR REPLACE FUNCTION sync_phone_from_auth_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync from auth.users to profiles, no reverse sync
  -- This prevents infinite loops
  UPDATE profiles 
  SET phone = NEW.phone,
      updated_at = now()
  WHERE user_id = NEW.id
    AND (phone IS DISTINCT FROM NEW.phone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the one-way trigger
CREATE TRIGGER sync_phone_from_auth_trigger
  AFTER INSERT OR UPDATE OF phone ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION sync_phone_from_auth_simple();

-- Update the handle_new_user function to not rely on phone sync
-- since we'll handle phone sync separately
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
      new.phone,  -- Include phone directly in profile creation
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
        INSERT INTO public.profiles (user_id, display_name, role, phone, created_at, updated_at)
        VALUES (new.id, 'Utilisateur Mobile', 'agent', new.phone, now(), now());
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_phone_from_auth_simple() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION sync_phone_from_auth_simple() IS 
'One-way phone sync from auth.users to profiles to prevent infinite loops';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Creates profile for new users with phone sync handled directly to prevent trigger conflicts';
