-- Add latitude and longitude columns to cooperatives table for mapping functionality

-- Add coordinate columns
ALTER TABLE public.cooperatives 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add constraints for valid coordinates
ALTER TABLE public.cooperatives 
ADD CONSTRAINT cooperatives_latitude_check 
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE public.cooperatives 
ADD CONSTRAINT cooperatives_longitude_check 
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Add index for coordinate queries
CREATE INDEX IF NOT EXISTS idx_cooperatives_coordinates 
ON public.cooperatives (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add some sample coordinates for existing cooperatives (Dakar region)
-- These are example coordinates for demonstration purposes
UPDATE public.cooperatives 
SET 
  latitude = CASE 
    WHEN name ILIKE '%dakar%' THEN 14.7167
    WHEN name ILIKE '%thies%' THEN 14.7886
    WHEN name ILIKE '%kaolack%' THEN 14.1389
    WHEN name ILIKE '%saint-louis%' THEN 16.0333
    ELSE 14.7167 -- Default to Dakar
  END,
  longitude = CASE 
    WHEN name ILIKE '%dakar%' THEN -17.4677
    WHEN name ILIKE '%thies%' THEN -16.9261
    WHEN name ILIKE '%kaolack%' THEN -16.0756
    WHEN name ILIKE '%saint-louis%' THEN -16.5000
    ELSE -17.4677 -- Default to Dakar
  END,
  description = CASE 
    WHEN description IS NULL THEN 'Coopérative agricole locale'
    ELSE description
  END
WHERE latitude IS NULL OR longitude IS NULL;

-- Add RLS policies for the new columns
-- The existing policies already cover all columns, so no additional policies needed
