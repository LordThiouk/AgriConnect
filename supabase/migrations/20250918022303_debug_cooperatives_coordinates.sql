-- Debug script to check cooperatives coordinates
-- This will help us understand why only one cooperative is showing on the map

-- Check total cooperatives and their coordinates
SELECT 
  COUNT(*) as total_cooperatives,
  COUNT(latitude) as with_latitude,
  COUNT(longitude) as with_longitude,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_both_coords
FROM cooperatives;

-- Show all cooperatives with their coordinates
SELECT 
  id,
  name,
  region,
  department,
  commune,
  latitude,
  longitude,
  CASE 
    WHEN latitude IS NULL THEN 'No latitude'
    WHEN longitude IS NULL THEN 'No longitude'
    WHEN latitude < -90 OR latitude > 90 THEN 'Invalid latitude range'
    WHEN longitude < -180 OR longitude > 180 THEN 'Invalid longitude range'
    ELSE 'Valid coordinates'
  END as coordinate_status
FROM cooperatives
ORDER BY name;

-- Check if there are any cooperatives with NULL coordinates that should have been updated
SELECT 
  id,
  name,
  region,
  department,
  commune,
  latitude,
  longitude
FROM cooperatives
WHERE latitude IS NULL OR longitude IS NULL
ORDER BY name;
