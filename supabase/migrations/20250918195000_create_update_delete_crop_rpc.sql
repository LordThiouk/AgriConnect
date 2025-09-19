-- Créer une fonction RPC pour mettre à jour une culture
CREATE OR REPLACE FUNCTION update_crop_for_agent(
  p_crop_id UUID,
  p_crop_type TEXT,
  p_variety TEXT,
  p_sowing_date DATE,
  p_status TEXT,
  p_agent_auth_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_profile_id UUID;
  updated_crop_id UUID;
BEGIN
  -- Trouver le Profile ID pour l'Auth ID
  SELECT p.id INTO agent_profile_id 
  FROM profiles p 
  WHERE p.user_id = p_agent_auth_id;
  
  IF agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil trouvé pour l''Auth ID: %', p_agent_auth_id;
  END IF;
  
  -- Vérifier que la culture appartient à une parcelle d'un producteur assigné à cet agent
  IF NOT EXISTS (
    SELECT 1 
    FROM crops c
    JOIN farm_file_plots ffp ON ffp.id = c.farm_file_plot_id
    WHERE c.id = p_crop_id
      AND ffp.producer_id IN (
        SELECT apa.producer_id 
        FROM agent_producer_assignments apa
        WHERE apa.agent_id = agent_profile_id
      )
  ) THEN
    RAISE EXCEPTION 'Culture non trouvée ou accès non autorisé';
  END IF;
  
  -- Mettre à jour la culture
  UPDATE crops 
  SET 
    crop_type = p_crop_type,
    variety = p_variety,
    sowing_date = p_sowing_date,
    status = p_status,
    updated_at = now()
  WHERE id = p_crop_id
  RETURNING id INTO updated_crop_id;
  
  IF updated_crop_id IS NULL THEN
    RAISE EXCEPTION 'Erreur lors de la mise à jour de la culture';
  END IF;
  
  RETURN updated_crop_id;
END;
$$;

-- Créer une fonction RPC pour supprimer une culture
CREATE OR REPLACE FUNCTION delete_crop_for_agent(
  p_crop_id UUID,
  p_agent_auth_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_profile_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Trouver le Profile ID pour l'Auth ID
  SELECT p.id INTO agent_profile_id 
  FROM profiles p 
  WHERE p.user_id = p_agent_auth_id;
  
  IF agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil trouvé pour l''Auth ID: %', p_agent_auth_id;
  END IF;
  
  -- Vérifier que la culture appartient à une parcelle d'un producteur assigné à cet agent
  IF NOT EXISTS (
    SELECT 1 
    FROM crops c
    JOIN farm_file_plots ffp ON ffp.id = c.farm_file_plot_id
    WHERE c.id = p_crop_id
      AND ffp.producer_id IN (
        SELECT apa.producer_id 
        FROM agent_producer_assignments apa
        WHERE apa.agent_id = agent_profile_id
      )
  ) THEN
    RAISE EXCEPTION 'Culture non trouvée ou accès non autorisé';
  END IF;
  
  -- Supprimer la culture
  DELETE FROM crops 
  WHERE id = p_crop_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION update_crop_for_agent(UUID, TEXT, TEXT, DATE, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_crop_for_agent(UUID, UUID) TO authenticated;
