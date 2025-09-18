-- Créer une fonction RPC pour récupérer les parcelles de l'agent
CREATE OR REPLACE FUNCTION get_agent_plots(agent_auth_id UUID)
RETURNS TABLE (
  id UUID,
  producer_id UUID,
  plot_id UUID,
  name_season_snapshot TEXT,
  area_hectares NUMERIC,
  geom GEOMETRY,
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
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
  WHERE p.user_id = agent_auth_id;
  
  IF agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil trouvé pour l''Auth ID: %', agent_auth_id;
  END IF;
  
  -- Retourner les parcelles des producteurs assignés à cet agent
  RETURN QUERY
  SELECT 
    ffp.id,
    ffp.producer_id,
    ffp.plot_id,
    ffp.name_season_snapshot,
    ffp.area_hectares,
    ffp.geom,
    pr.first_name,
    pr.last_name,
    pr.phone,
    ffp.created_at,
    ffp.updated_at
  FROM farm_file_plots ffp
  JOIN producers pr ON pr.id = ffp.producer_id
  WHERE ffp.producer_id IN (
    SELECT apa.producer_id 
    FROM agent_producer_assignments apa
    WHERE apa.agent_id = agent_profile_id
  )
  ORDER BY ffp.created_at DESC;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_agent_plots(UUID) TO authenticated;
