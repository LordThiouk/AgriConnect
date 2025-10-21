-- Update media.entity_type to accept 'agent'
-- Safe re-creation of CHECK constraint to include the new value

DO $$
BEGIN
  -- Drop existing constraint if it exists (name may vary by environment)
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class t ON c.conrelid = t.oid
    JOIN   pg_namespace n ON n.oid = t.relnamespace
    WHERE  t.relname = 'media'
    AND    n.nspname = 'public'
    AND    c.conname = 'media_entity_type_check'
  ) THEN
    ALTER TABLE public.media DROP CONSTRAINT media_entity_type_check;
  END IF;

  -- Create/replace the CHECK constraint with 'agent' added
  ALTER TABLE public.media
    ADD CONSTRAINT media_entity_type_check
    CHECK (entity_type IN ('plot', 'crop', 'operation', 'observation', 'producer', 'agent'));
END $$;

-- Optional: reindex if needed (indexes already exist on entity_type, entity_id)
-- CREATE INDEX IF NOT EXISTS idx_media_entity_type_id ON public.media(entity_type, entity_id);

