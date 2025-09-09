-- Create enum for approval status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_approval_status'
  ) THEN
    CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

-- Add column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN approval_status user_approval_status NOT NULL DEFAULT 'approved';
  END IF;
END$$;

-- Ensure default for existing rows: agents should be pending, others approved
UPDATE public.profiles
SET approval_status = CASE WHEN role = 'agent' THEN 'pending'::user_approval_status ELSE 'approved'::user_approval_status END
WHERE approval_status IS NULL OR approval_status = 'approved';

-- Function: enforce pending for agents on insert/update
CREATE OR REPLACE FUNCTION public.set_agent_pending()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    NEW.approval_status := 'pending';
  ELSIF NEW.approval_status IS NULL THEN
    NEW.approval_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on insert
DROP TRIGGER IF EXISTS trg_profiles_set_agent_pending_ins ON public.profiles;
CREATE TRIGGER trg_profiles_set_agent_pending_ins
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_agent_pending();

-- Trigger on update (role changes)
DROP TRIGGER IF EXISTS trg_profiles_set_agent_pending_upd ON public.profiles;
CREATE TRIGGER trg_profiles_set_agent_pending_upd
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
WHEN (NEW.role IS DISTINCT FROM OLD.role)
EXECUTE FUNCTION public.set_agent_pending();

-- Index for admin filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_profiles_approval_status'
  ) THEN
    CREATE INDEX idx_profiles_approval_status ON public.profiles (approval_status);
  END IF;
END$$;


