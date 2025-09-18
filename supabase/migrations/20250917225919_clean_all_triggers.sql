-- Clean all triggers and start fresh
-- This will remove all problematic triggers and create a simple working solution

-- Remove ALL triggers that might interfere with user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_minimal ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_from_auth_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_phone_from_profiles_trigger ON profiles;

-- Remove ALL functions that might cause issues
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_minimal();
DROP FUNCTION IF EXISTS sync_phone_from_auth();
DROP FUNCTION IF EXISTS sync_phone_from_auth_simple();
DROP FUNCTION IF EXISTS sync_phone_to_auth();

-- Create a very simple, working handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple profile creation without any complex logic
  INSERT INTO public.profiles (user_id, display_name, role, phone, created_at, updated_at)
  VALUES (
    new.id, 
    'Utilisateur Mobile',
    'agent',
    new.phone,
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

-- Create the simple trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Simple profile creation trigger without complex logic';
