-- Migration: Amélioration de get_plot_by_id avec détails complets pour affichage

DROP FUNCTION IF EXISTS get_plot_by_id(UUID, UUID);

CREATE OR REPLACE FUNCTION get_plot_by_id(p_plot_id UUID, p_agent_auth_id UUID)
RETURNS TABLE (
  id UUID,
  producer_id UUID,
  plot_id UUID,
  name_season_snapshot TEXT,
  area_hectares NUMERIC,
  variety TEXT,
  soil_type TEXT,
  water_source TEXT,
  status TEXT,
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location TEXT,
  crops_count BIGINT,
  last_operation TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_profile_id UUID;
BEGIN
  -- Trouver le Profile ID pour l'Auth ID
  SELECT p.id INTO agent_profile_id 
  FROM profiles p 
  WHERE p.user_id = p_agent_auth_id;
  
  IF agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil trouvé pour l''Auth ID: %', p_agent_auth_id;
  END IF;
  
  -- Retourner la parcelle avec détails complets si elle appartient à un producteur assigné à cet agent
  RETURN QUERY
  SELECT 
    ffp.id,
    ffp.producer_id,
    ffp.plot_id,
    ffp.name_season_snapshot,
    ffp.area_hectares,
    ffp.variety,
    ffp.soil_type,
    ffp.water_source,
    ffp.status,
    pr.first_name,
    pr.last_name,
    pr.phone,
    -- Coordonnées calculées côté serveur
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_Y(ffp.center_point::geometry)
      WHEN ffp.geom IS NOT NULL THEN ST_Y(ST_Centroid(ffp.geom))
      ELSE NULL
    END as latitude,
    CASE 
      WHEN ffp.center_point IS NOT NULL THEN ST_X(ffp.center_point::geometry)
      WHEN ffp.geom IS NOT NULL THEN ST_X(ST_Centroid(ffp.geom))
      ELSE NULL
    END as longitude,
    -- Localisation
    COALESCE(
      CONCAT(ff.village, ', ', ff.commune, ', ', ff.department),
      COALESCE(ff.village, ff.commune, ff.department, 'Non renseigné')
    ) as location,
    -- Agrégations
    (
      SELECT COUNT(*) 
      FROM crops c 
      WHERE c.parcel_id = ffp.id
    ) as crops_count,
    (
      SELECT op.operation_type 
      FROM operations op 
      WHERE op.parcel_id = ffp.id 
      ORDER BY op.operation_date DESC 
      LIMIT 1
    ) as last_operation,
    ffp.created_at,
    ffp.updated_at
  FROM farm_file_plots ffp
  JOIN producers pr ON pr.id = ffp.producer_id
  JOIN farm_files ff ON ffp.farm_file_id = ff.id
  WHERE ffp.id = p_plot_id
    AND ffp.producer_id IN (
      SELECT apa.producer_id 
      FROM agent_producer_assignments apa
      WHERE apa.agent_id = agent_profile_id
    );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_plot_by_id(UUID, UUID) TO authenticated;
