-- Allow NULL profile_id in notifications table for system notifications

-- Drop the existing foreign key constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_profile_id_fkey;

-- Add a new foreign key constraint that allows NULL
ALTER TABLE notifications 
ADD CONSTRAINT notifications_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the column to allow NULL
ALTER TABLE notifications ALTER COLUMN profile_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN notifications.profile_id IS 'User ID for the notification recipient. NULL for system notifications.';
