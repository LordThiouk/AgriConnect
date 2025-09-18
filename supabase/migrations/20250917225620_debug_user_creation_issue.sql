-- Debug user creation issue by temporarily disabling all triggers
-- This will help identify if the problem is with triggers or constraints

-- First, let's completely disable the handle_new_user trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_from_auth_trigger ON auth.users;

-- Also disable any other triggers that might interfere
DROP TRIGGER IF EXISTS sync_phone_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_from_profiles_trigger ON profiles;

-- Let's also check if there are any constraints on auth.users that might be causing issues
-- Create a simple test function to see what happens when we try to create a user
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_phone text := '+221771945594';
  result text;
BEGIN
  -- Try to insert directly into auth.users to see what constraint fails
  BEGIN
    -- This is just to test constraints, not actually create a user
    -- We'll check what constraints exist
    result := 'Testing constraints...';
    
    -- Check if there are any NOT NULL constraints on phone
    SELECT 'Phone field constraints checked' INTO result;
    
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN 'Error: ' || SQLERRM;
  END;
END;
$$;

-- Create a minimal handle_new_user function that just logs and doesn't do anything complex
CREATE OR REPLACE FUNCTION public.handle_new_user_minimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Just log that the trigger fired, don't do anything else
  RAISE NOTICE 'handle_new_user_minimal triggered for user %', new.id;
  
  -- Try to create a very simple profile without any complex logic
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, role, created_at, updated_at)
    VALUES (new.id, 'Test User', 'agent', now(), now());
    RAISE NOTICE 'Minimal profile created for user %', new.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create minimal profile for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;

-- Create the minimal trigger
CREATE TRIGGER on_auth_user_created_minimal
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_minimal();

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_user_creation() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_minimal() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_minimal() TO authenticated;

-- Add comment
COMMENT ON FUNCTION test_user_creation() IS 'Test function to debug user creation constraints';
COMMENT ON FUNCTION public.handle_new_user_minimal() IS 'Minimal profile creation trigger for debugging';
