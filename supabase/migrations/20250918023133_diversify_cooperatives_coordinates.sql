-- Diversify cooperatives coordinates to avoid overlapping markers on the map
-- This will assign different coordinates to cooperatives based on their region and add some random variation

-- First, let's add some random variation to existing coordinates
-- We'll add small random offsets to spread cooperatives around their region centers

-- Dakar region - spread around Dakar
UPDATE public.cooperatives 
SET 
  latitude = 14.7167 + (RANDOM() - 0.5) * 0.1, -- ±0.05 degrees variation
  longitude = -17.4677 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%dakar%' OR name ILIKE '%dakar%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Kaolack region - spread around Kaolack
UPDATE public.cooperatives 
SET 
  latitude = 14.1514 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.0753 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%kaolack%' OR name ILIKE '%kaolack%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Thiès region - spread around Thiès
UPDATE public.cooperatives 
SET 
  latitude = 14.7894 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.9260 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%thiès%' OR name ILIKE '%thiès%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Saint-Louis region - spread around Saint-Louis
UPDATE public.cooperatives 
SET 
  latitude = 16.0322 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.4887 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%saint-louis%' OR name ILIKE '%saint-louis%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Ziguinchor region - spread around Ziguinchor
UPDATE public.cooperatives 
SET 
  latitude = 12.5833 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.2719 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%ziguinchor%' OR name ILIKE '%ziguinchor%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Tambacounda region - spread around Tambacounda
UPDATE public.cooperatives 
SET 
  latitude = 13.7689 + (RANDOM() - 0.5) * 0.1,
  longitude = -13.6673 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%tambacounda%' OR name ILIKE '%tambacounda%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Diourbel region - spread around Diourbel
UPDATE public.cooperatives 
SET 
  latitude = 14.6561 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.2314 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%diourbel%' OR name ILIKE '%diourbel%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Kaffrine region - spread around Kaffrine
UPDATE public.cooperatives 
SET 
  latitude = 14.1056 + (RANDOM() - 0.5) * 0.1,
  longitude = -15.5467 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%kaffrine%' OR name ILIKE '%kaffrine%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Fatick region - spread around Fatick
UPDATE public.cooperatives 
SET 
  latitude = 14.3392 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.4119 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%fatick%' OR name ILIKE '%fatick%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Louga region - spread around Louga
UPDATE public.cooperatives 
SET 
  latitude = 15.6186 + (RANDOM() - 0.5) * 0.1,
  longitude = -16.2244 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%louga%' OR name ILIKE '%louga%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Matam region - spread around Matam
UPDATE public.cooperatives 
SET 
  latitude = 15.6558 + (RANDOM() - 0.5) * 0.1,
  longitude = -13.2556 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%matam%' OR name ILIKE '%matam%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Sédhiou region - spread around Sédhiou
UPDATE public.cooperatives 
SET 
  latitude = 12.7083 + (RANDOM() - 0.5) * 0.1,
  longitude = -15.5569 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%sédhiou%' OR name ILIKE '%sédhiou%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Kolda region - spread around Kolda
UPDATE public.cooperatives 
SET 
  latitude = 12.8833 + (RANDOM() - 0.5) * 0.1,
  longitude = -14.9500 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%kolda%' OR name ILIKE '%kolda%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- Kédougou region - spread around Kédougou
UPDATE public.cooperatives 
SET 
  latitude = 12.5578 + (RANDOM() - 0.5) * 0.1,
  longitude = -12.1742 + (RANDOM() - 0.5) * 0.1
WHERE region ILIKE '%kédougou%' OR name ILIKE '%kédougou%'
  AND latitude = 14.7167 AND longitude = -17.4677;

-- For cooperatives without specific region, assign them to different areas
-- Assign some to different regions with random variation
UPDATE public.cooperatives 
SET 
  latitude = 14.7167 + (RANDOM() - 0.5) * 0.2, -- ±0.1 degrees variation
  longitude = -17.4677 + (RANDOM() - 0.5) * 0.2
WHERE latitude = 14.7167 AND longitude = -17.4677
  AND (region IS NULL OR region = '' OR region NOT ILIKE '%dakar%' AND region NOT ILIKE '%kaolack%' 
       AND region NOT ILIKE '%thiès%' AND region NOT ILIKE '%saint-louis%' 
       AND region NOT ILIKE '%ziguinchor%' AND region NOT ILIKE '%tambacounda%'
       AND region NOT ILIKE '%diourbel%' AND region NOT ILIKE '%kaffrine%'
       AND region NOT ILIKE '%fatick%' AND region NOT ILIKE '%louga%'
       AND region NOT ILIKE '%matam%' AND region NOT ILIKE '%sédhiou%'
       AND region NOT ILIKE '%kolda%' AND region NOT ILIKE '%kédougou%');

-- Add a comment to document this migration
COMMENT ON TABLE public.cooperatives IS 'Cooperatives table with diversified coordinates to avoid overlapping markers on the map. Each cooperative now has unique coordinates within their region.';
