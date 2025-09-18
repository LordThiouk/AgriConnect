-- Fix cooperative deletion by handling foreign key constraints
-- We need to either cascade delete or set to null for dependent records

-- First, let's check what tables reference cooperatives
-- The error shows farm_files has a foreign key to cooperatives

-- Option 1: Modify the foreign key constraint to CASCADE DELETE
-- This will automatically delete all farm_files when a cooperative is deleted

-- Drop the existing foreign key constraint
ALTER TABLE public.farm_files 
DROP CONSTRAINT IF EXISTS farm_files_cooperative_id_fkey;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE public.farm_files 
ADD CONSTRAINT farm_files_cooperative_id_fkey 
FOREIGN KEY (cooperative_id) 
REFERENCES public.cooperatives(id) 
ON DELETE CASCADE;

-- Also check if there are other tables that might reference cooperatives
-- Let's add CASCADE to other potential foreign keys

-- Check and fix producers table if it has cooperative_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producers' 
        AND column_name = 'cooperative_id'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE public.producers 
        DROP CONSTRAINT IF EXISTS producers_cooperative_id_fkey;
        
        -- Add CASCADE constraint
        ALTER TABLE public.producers 
        ADD CONSTRAINT producers_cooperative_id_fkey 
        FOREIGN KEY (cooperative_id) 
        REFERENCES public.cooperatives(id) 
        ON DELETE SET NULL; -- Set to NULL instead of CASCADE for producers
    END IF;
END $$;
