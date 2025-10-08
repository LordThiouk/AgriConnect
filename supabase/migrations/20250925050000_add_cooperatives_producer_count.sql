-- Migration pour ajouter le calcul du nombre de producteurs par coopérative
-- Date: 2025-09-25

-- Fonction RPC pour obtenir les coopératives avec le nombre de producteurs
CREATE OR REPLACE FUNCTION get_cooperatives_with_producer_count(
  p_search TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_commune TEXT DEFAULT NULL,
  p_has_geo BOOLEAN DEFAULT NULL,
  p_min_producers INTEGER DEFAULT NULL,
  p_max_producers INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  region TEXT,
  department TEXT,
  commune TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(10,8),
  geom GEOMETRY(POINT, 4326),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  producer_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.region,
    c.department,
    c.commune,
    c.address,
    c.phone,
    c.email,
    c.contact_person,
    c.latitude,
    c.longitude,
    c.geom,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(p.id), 0) as producer_count
  FROM cooperatives c
  LEFT JOIN producers p ON c.id = p.cooperative_id
  WHERE 
    (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.description ILIKE '%' || p_search || '%')
    AND (p_region IS NULL OR c.region = p_region)
    AND (p_department IS NULL OR c.department = p_department)
    AND (p_commune IS NULL OR c.commune = p_commune)
    AND (p_has_geo IS NULL OR (p_has_geo = true AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL) OR (p_has_geo = false AND (c.latitude IS NULL OR c.longitude IS NULL)))
  GROUP BY c.id, c.name, c.description, c.region, c.department, c.commune, c.address, c.phone, c.email, c.contact_person, c.latitude, c.longitude, c.geom, c.created_at, c.updated_at
  HAVING 
    (p_min_producers IS NULL OR COUNT(p.id) >= p_min_producers)
    AND (p_max_producers IS NULL OR COUNT(p.id) <= p_max_producers)
  ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour permettre l'accès à la fonction
GRANT EXECUTE ON FUNCTION get_cooperatives_with_producer_count TO authenticated;
