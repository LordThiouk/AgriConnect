-- Add sample coordinates to existing cooperatives in Senegal
-- This will help display cooperatives on the map

-- Update cooperatives with sample coordinates in different regions of Senegal
UPDATE public.cooperatives 
SET 
  latitude = 14.7167,
  longitude = -17.4677
WHERE name ILIKE '%dakar%' OR region ILIKE '%dakar%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Kaolack region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 14.1514,
  longitude = -16.0753
WHERE region ILIKE '%kaolack%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Thiès region coordinates  
UPDATE public.cooperatives 
SET 
  latitude = 14.7894,
  longitude = -16.9260
WHERE region ILIKE '%thiès%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Saint-Louis region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 16.0322,
  longitude = -16.4887
WHERE region ILIKE '%saint-louis%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Ziguinchor region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 12.5833,
  longitude = -16.2719
WHERE region ILIKE '%ziguinchor%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Tambacounda region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 13.7689,
  longitude = -13.6673
WHERE region ILIKE '%tambacounda%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Diourbel region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 14.6561,
  longitude = -16.2314
WHERE region ILIKE '%diourbel%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Kaffrine region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 14.1056,
  longitude = -15.5467
WHERE region ILIKE '%kaffrine%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Fatick region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 14.3392,
  longitude = -16.4119
WHERE region ILIKE '%fatick%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Louga region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 15.6186,
  longitude = -16.2244
WHERE region ILIKE '%louga%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Matam region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 15.6558,
  longitude = -13.2556
WHERE region ILIKE '%matam%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Sédhiou region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 12.7083,
  longitude = -15.5569
WHERE region ILIKE '%sédhiou%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Kolda region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 12.8833,
  longitude = -14.9500
WHERE region ILIKE '%kolda%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Kédougou region coordinates
UPDATE public.cooperatives 
SET 
  latitude = 12.5578,
  longitude = -12.1742
WHERE region ILIKE '%kédougou%'
  AND (latitude IS NULL OR longitude IS NULL);

-- Add a comment to document this migration
COMMENT ON TABLE public.cooperatives IS 'Cooperatives table with latitude/longitude coordinates for mapping. Sample coordinates added for major Senegalese regions.';
