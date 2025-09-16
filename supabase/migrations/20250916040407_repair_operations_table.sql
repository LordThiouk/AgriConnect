-- Step 1: Drop the existing foreign key constraint if it exists
ALTER TABLE public.operations
DROP CONSTRAINT IF EXISTS operations_performed_by_fkey;

-- Step 2: Rename the column if it exists
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='performed_by') THEN
      ALTER TABLE public.operations RENAME COLUMN performed_by TO performer_id;
   END IF;
END $$;

-- Step 3: Add the performer_type column if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='performer_type') THEN
      ALTER TABLE public.operations ADD COLUMN performer_type TEXT;
   END IF;
END $$;

-- Step 4: Backfill the performer_type for existing records
UPDATE public.operations
SET performer_type = 'profile'
WHERE performer_id IS NOT NULL AND performer_type IS NULL;

-- Step 5: Add a check constraint to ensure data integrity
ALTER TABLE public.operations
ADD CONSTRAINT check_performer_type
CHECK (performer_type IN ('profile', 'participant'));

COMMENT ON COLUMN public.operations.performer_id IS 'ID of the performer, references either profiles.id or participants.id based on performer_type.';
COMMENT ON COLUMN public.operations.performer_type IS 'Type of the performer, either ''profile'' or ''participant''.';
