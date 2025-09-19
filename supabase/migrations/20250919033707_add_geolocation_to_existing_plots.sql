-- Add geolocation data to existing farm_file_plots entries

-- Update existing farm_file_plots entries with center_point coordinates
UPDATE farm_file_plots 
SET 
  center_point = ST_SetSRID(ST_MakePoint(
    -17.4677 + (random() - 0.5) * 0.1,  -- Longitude around Dakar
    14.7167 + (random() - 0.5) * 0.1    -- Latitude around Dakar
  ), 4326)
WHERE center_point IS NULL;

-- Add some sample data to farm_file_plots if they don't exist
INSERT INTO farm_file_plots (
  id,
  plot_id,
  producer_id,
  name_season_snapshot,
  area_hectares,
  soil_type,
  water_source,
  status,
  center_point,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.producer_id,
  p.name || ' - Saison 2024',
  2.0 + random() * 3.0, -- Random area between 2-5 hectares
  (ARRAY['sandy', 'clay', 'loam', 'silt'])[floor(random() * 4 + 1)],
  (ARRAY['rain', 'irrigation', 'well', 'river'])[floor(random() * 4 + 1)],
  (ARRAY['active', 'inactive'])[floor(random() * 2 + 1)],
  ST_SetSRID(ST_MakePoint(
    -17.4677 + (random() - 0.5) * 0.1,  -- Longitude around Dakar
    14.7167 + (random() - 0.5) * 0.1    -- Latitude around Dakar
  ), 4326),
  NOW(),
  NOW()
FROM plots p
WHERE NOT EXISTS (
  SELECT 1 FROM farm_file_plots ffp WHERE ffp.plot_id = p.id
)
LIMIT 20;
