-- Corriger la fonction RPC get_crop_by_id pour utiliser farm_file_plot_id
DROP FUNCTION IF EXISTS get_crop_by_id(UUID, UUID);

-- Recréer la fonction avec farm_file_plot_id
CREATE FUNCTION get_crop_by_id(p_crop_id UUID, p_agent_auth_id UUID)
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
  
  -- Retourner la culture si elle appartient à une parcelle d'un producteur assigné à cet agent
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
  WHERE c.id = p_crop_id
    AND ffp.producer_id IN (
      SELECT apa.producer_id 
      FROM agent_producer_assignments apa
      WHERE apa.agent_id = agent_profile_id
    );
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_crop_by_id(UUID, UUID) TO authenticated;
