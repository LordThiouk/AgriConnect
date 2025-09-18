-- Add phone synchronization between auth.users and profiles
-- This ensures phone numbers are automatically synced when users register on mobile

-- Create function to sync phone from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_phone_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles.phone when auth.users.phone changes
  -- Use a flag to prevent infinite recursion
  UPDATE profiles 
  SET phone = NEW.phone 
  WHERE user_id = NEW.id
    AND (phone IS DISTINCT FROM NEW.phone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync phone numbers from auth to profiles
CREATE TRIGGER sync_phone_trigger
  AFTER INSERT OR UPDATE OF phone ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_phone_from_auth();

-- Initial sync: populate profiles.phone from existing auth.users.phone
UPDATE profiles 
SET phone = auth_users.phone
FROM auth.users AS auth_users
WHERE profiles.user_id = auth_users.id 
  AND auth_users.phone IS NOT NULL
  AND profiles.phone IS NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_phone_from_auth() TO service_role;
