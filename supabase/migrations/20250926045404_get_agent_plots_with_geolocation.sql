-- Migration: Création de get_agent_plots_with_geolocation pour filtrer par assignments agent-producteur
-- Date: 2025-09-26
-- Description: Nouvelle RPC qui combine le filtrage par assignments d'agent avec calcul géolocalisation côté serveur

CREATE OR REPLACE FUNCTION get_agent_plots_with_geolocation(p_agent_user_id UUID)
RETURNS TABLE (
  id UUID,                           -- farm_file_plots.id
  farm_file_plot_id UUID,            -- farm_file_plots.id
  name TEXT,                         -- farm_file_plots.name_season_snapshot
  area_hectares NUMERIC,             -- farm_file_plots.area_hectares
  soil_type TEXT,                    -- farm_file_plots.soil_type
  water_source TEXT,                 -- farm_file_plots.water_source
  status TEXT,                       -- farm_file_plots.status
  latitude DOUBLE PRECISION,         -- Calculé côté serveur
  longitude DOUBLE PRECISION,        -- Calculé côté serveur
  producer_first_name TEXT,          -- producers.first_name
  producer_last_name TEXT,           -- producers.last_name
  producer_phone TEXT               -- producers.phone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_profile_id UUID;
BEGIN
  -- 1. Trouver le profil agent à partir de user_id
  SELECT p.id INTO v_agent_profile_id 
  FROM profiles p 
  WHERE p.user_id = p_agent_user_id AND p.role = 'agent';
  
  IF v_agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil agent trouvé pour user_id: %', p_agent_user_id;
  END IF;

  -- 2. Retourner les parcelles avec géolocalisation calculée côté serveur
  RETURN QUERY
  SELECT 
    ffp.id,
    ffp.id as farm_file_plot_id,
    ffp.name_season_snapshot as name,
    ffp.area_hectares,
    ffp.soil_type,
    ffp.water_source,
    ffp.status,
    -- Coordonnées calculées côté serveur comme get_plots_with_geolocation
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
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.phone as producer_phone
  FROM farm_file_plots ffp
  INNER JOIN farm_files ff ON ffp.farm_file_id = ff.id
  INNER JOIN producers p ON ff.responsible_producer_id = p.id
  INNER JOIN agent_producer_assignments apa ON p.id = apa.producer_id
  WHERE apa.agent_id = v_agent_profile_id
  ORDER BY ffp.created_at DESC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_agent_plots_with_geolocation(UUID) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_agent_plots_with_geolocation(UUID) IS 'Récupère les parcelles assignées à un agent avec géolocalisation calculée côté serveur';
