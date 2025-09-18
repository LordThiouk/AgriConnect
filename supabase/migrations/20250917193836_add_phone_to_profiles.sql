-- Add phone field to profiles table
-- This will allow agents to have phone numbers directly in their profile

-- Add phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN phone text;

-- Add comment for clarity
COMMENT ON COLUMN profiles.phone IS 'Phone number for the user (agents, supervisors, etc.)';

-- Create function to sync phone from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_phone_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles.phone when auth.users.phone changes
  UPDATE profiles 
  SET phone = NEW.phone 
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync phone numbers
CREATE TRIGGER sync_phone_trigger
  AFTER INSERT OR UPDATE OF phone ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_phone_from_auth();

-- Create function to sync phone from profiles to auth.users (for manual updates)
CREATE OR REPLACE FUNCTION sync_phone_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users.phone when profiles.phone changes
  UPDATE auth.users 
  SET phone = NEW.phone 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync phone from profiles to auth.users
CREATE TRIGGER sync_phone_from_profiles_trigger
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_phone_to_auth();

-- Initial sync: populate profiles.phone from existing auth.users.phone
UPDATE profiles 
SET phone = auth_users.phone
FROM auth.users AS auth_users
WHERE profiles.user_id = auth_users.id 
  AND auth_users.phone IS NOT NULL;

-- Update the RPC functions to use profiles.phone instead of producers.phone
CREATE OR REPLACE FUNCTION get_available_agents()
RETURNS TABLE (
  id uuid,
  display_name text,
  phone text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    COALESCE(p.phone, 'Non disponible') as phone
  FROM profiles p
  WHERE p.role = 'agent' 
    AND p.approval_status = 'approved'
  ORDER BY p.display_name;
END;
$$;

-- Update the function to get assigned agents
CREATE OR REPLACE FUNCTION get_producer_assigned_agents(producer_uuid uuid)
RETURNS TABLE (
  agent_id uuid,
  display_name text,
  phone text,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    apa.agent_id,
    p.display_name,
    COALESCE(p.phone, 'Non disponible') as phone,
    apa.assigned_at
  FROM agent_producer_assignments apa
  JOIN profiles p ON apa.agent_id = p.id
  WHERE apa.producer_id = producer_uuid
  ORDER BY apa.assigned_at DESC;
END;
$$;
