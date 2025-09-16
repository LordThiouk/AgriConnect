-- Add phone column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producers' AND column_name = 'phone') THEN
    ALTER TABLE public.producers ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add profile_id column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producers' AND column_name = 'profile_id') THEN
    ALTER TABLE public.producers ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add a unique constraint to the phone column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'producers_phone_unique' AND conrelid = 'public.producers'::regclass) THEN
    ALTER TABLE public.producers ADD CONSTRAINT producers_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Add an index on the new profile_id column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'producers' AND indexname = 'idx_producers_profile_id') THEN
    CREATE INDEX idx_producers_profile_id ON public.producers(profile_id);
  END IF;
END $$;
