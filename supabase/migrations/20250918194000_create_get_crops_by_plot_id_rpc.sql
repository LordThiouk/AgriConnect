-- Créer une fonction RPC pour récupérer toutes les cultures d'une parcelle
CREATE OR REPLACE FUNCTION get_crops_by_plot_id(p_plot_id UUID, p_agent_auth_id UUID)
RETURNS TABLE (
  id UUID,
  farm_file_plot_id UUID,
  season_id UUID,
  crop_type TEXT,
  variety TEXT,
  sowing_date DATE,
  status TEXT,
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
  
  -- Retourner toutes les cultures de la parcelle si elle appartient à un producteur assigné à cet agent
  RETURN QUERY
  SELECT 
    c.id,
    c.farm_file_plot_id,
    c.season_id,
    c.crop_type,
    c.variety,
    c.sowing_date,
    c.status,
    c.created_at,
    c.updated_at
  FROM crops c
  JOIN farm_file_plots ffp ON ffp.id = c.farm_file_plot_id
  WHERE c.farm_file_plot_id = p_plot_id
    AND ffp.producer_id IN (
      SELECT apa.producer_id 
      FROM agent_producer_assignments apa
      WHERE apa.agent_id = agent_profile_id
    )
  ORDER BY c.sowing_date DESC;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_crops_by_plot_id(UUID, UUID) TO authenticated;
