-- add_created_by_to_crops.sql

ALTER TABLE public.crops
ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.crops.created_by IS 'Profile ID of the user who created the crop entry.';

-- Note: RLS policies for `crops` should be updated to use this new column
-- to restrict access based on the creator.
