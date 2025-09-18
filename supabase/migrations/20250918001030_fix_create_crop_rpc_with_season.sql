-- Corriger la fonction RPC create_crop_for_agent pour inclure season_id
DROP FUNCTION IF EXISTS create_crop_for_agent(UUID, TEXT, TEXT, TIMESTAMPTZ, UUID);

-- Créer la fonction RPC corrigée avec season_id
CREATE OR REPLACE FUNCTION create_crop_for_agent(
  p_plot_id UUID,
  p_crop_type TEXT,
  p_variety TEXT,
  p_sowing_date TIMESTAMPTZ,
  p_agent_auth_id UUID,
  p_season_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_profile_id UUID;
  new_crop_id UUID;
  season_id_to_use UUID;
BEGIN
  -- Trouver le Profile ID pour l'Auth ID
  SELECT p.id INTO agent_profile_id 
  FROM profiles p 
  WHERE p.user_id = p_agent_auth_id;
  
  IF agent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil trouvé pour l''Auth ID: %', p_agent_auth_id;
  END IF;
  
  -- Vérifier que la parcelle appartient à un producteur assigné à cet agent
  IF NOT EXISTS (
    SELECT 1 FROM farm_file_plots ffp
    JOIN agent_producer_assignments apa ON apa.producer_id = ffp.producer_id
    WHERE ffp.id = p_plot_id AND apa.agent_id = agent_profile_id
  ) THEN
    RAISE EXCEPTION 'La parcelle n''appartient pas à un producteur assigné à cet agent';
  END IF;
  
  -- Utiliser la saison fournie ou récupérer la saison active
  IF p_season_id IS NOT NULL THEN
    season_id_to_use := p_season_id;
  ELSE
    SELECT id INTO season_id_to_use FROM seasons WHERE is_active = true LIMIT 1;
    IF season_id_to_use IS NULL THEN
      RAISE EXCEPTION 'Aucune saison active trouvée';
    END IF;
  END IF;
  
  -- Créer la culture
  INSERT INTO crops (
    id,
    plot_id,
    season_id,
    crop_type,
    variety,
    sowing_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_plot_id,
    season_id_to_use,
    p_crop_type,
    p_variety,
    p_sowing_date,
    'en_cours',
    now(),
    now()
  ) RETURNING id INTO new_crop_id;
  
  RETURN new_crop_id;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION create_crop_for_agent(UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, UUID) TO authenticated;
