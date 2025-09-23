-- Fix create_notification to actually insert data with correct column names

-- Drop all existing versions
DROP FUNCTION IF EXISTS create_notification(text, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS create_notification(text, text, text, uuid, text, uuid, uuid) CASCADE;

-- Create the correct function that actually inserts data
CREATE OR REPLACE FUNCTION create_notification(
  p_title text,
  p_content text,
  p_channel text DEFAULT 'sms',
  p_recipient_id uuid DEFAULT NULL
)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification notifications;
BEGIN
  -- Insert the notification into the table with correct column names
  INSERT INTO notifications (
    title,
    body,
    channel,
    profile_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_title,
    p_content,  -- content parameter maps to body column
    p_channel,
    COALESCE(p_recipient_id, auth.uid()),  -- Use recipient_id or current user
    'pending',
    NOW(),
    NOW()
  )
  RETURNING * INTO new_notification;

  RETURN new_notification;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Crée une nouvelle notification dans la table notifications avec les bonnes colonnes';
