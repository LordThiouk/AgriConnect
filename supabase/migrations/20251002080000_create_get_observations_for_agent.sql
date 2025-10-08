-- Migration: Création du RPC get_observations_for_agent
-- Description: Récupère toutes les observations des producteurs assignés à un agent

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS get_observations_for_agent(uuid, integer, integer, text, integer);

CREATE OR REPLACE FUNCTION get_observations_for_agent(
    p_agent_id uuid,
    p_limit_count integer DEFAULT 50,
    p_offset_count integer DEFAULT 0,
    p_observation_type_filter text DEFAULT NULL,
    p_severity_filter integer DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    plot_id uuid,
    plot_name text,
    producer_id uuid,
    producer_name text,
    observation_type text,
    description text,
    severity integer,
    observation_date date,
    created_at timestamptz,
    updated_at timestamptz,
    notes text,
    crop_id uuid,
    crop_type text,
    crop_variety text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_producer_ids UUID[];
BEGIN
    -- Récupérer l'ID du profil agent
    SELECT profiles.id INTO v_agent_profile_id
    FROM public.profiles
    WHERE profiles.user_id = p_agent_id AND profiles.role = 'agent';

    IF v_agent_profile_id IS NULL THEN
        RAISE NOTICE 'Agent non trouvé pour user_id: %', p_agent_id;
        RETURN;
    END IF;

    -- Récupérer les IDs des producteurs assignés à cet agent
    SELECT array_agg(agent_assignments.assigned_to_id)
    INTO v_producer_ids
    FROM public.agent_assignments
    WHERE agent_assignments.agent_id = v_agent_profile_id
      AND agent_assignments.assigned_to_type = 'producer';

    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RAISE NOTICE 'Aucun producteur assigné à l''agent: %', v_agent_profile_id;
        RETURN;
    END IF;

    -- Retourner les observations avec filtres
    RETURN QUERY
    SELECT 
        o.id,
        o.plot_id,
        p.name_season_snapshot as plot_name,
        p.producer_id,
        CONCAT(pr.first_name, ' ', pr.last_name) as producer_name,
        o.observation_type,
        o.description,
        o.severity,
        o.observation_date,
        o.created_at,
        o.updated_at,
        o.recommendations as notes,
        o.crop_id,
        c.crop_type,
        c.variety as crop_variety
    FROM public.observations o
    JOIN public.plots p ON o.plot_id = p.id
    JOIN public.producers pr ON p.producer_id = pr.id
    LEFT JOIN public.crops c ON o.crop_id = c.id
    WHERE p.producer_id = ANY(v_producer_ids)
      AND (p_observation_type_filter IS NULL OR o.observation_type = p_observation_type_filter)
      AND (p_severity_filter IS NULL OR o.severity = p_severity_filter)
    ORDER BY o.created_at DESC
    LIMIT p_limit_count
    OFFSET p_offset_count;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_observations_for_agent(uuid, integer, integer, text, integer) IS 
'Recupere toutes les observations des producteurs assignes a un agent avec filtres';

-- Test de la fonction
DO $$
DECLARE
    test_agent_id UUID;
    observation_count INTEGER;
BEGIN
    -- Récupérer un agent de test
    SELECT profiles.user_id INTO test_agent_id
    FROM public.profiles
    WHERE profiles.role = 'agent'
    LIMIT 1;
    
    IF test_agent_id IS NOT NULL THEN
        -- Compter les observations retournées
        SELECT COUNT(*) INTO observation_count
        FROM get_observations_for_agent(test_agent_id, 10, 0);
        
        RAISE NOTICE 'Test get_observations_for_agent: % observations trouvees pour agent %', 
                     observation_count, test_agent_id;
    ELSE
        RAISE NOTICE 'Aucun agent trouve pour le test';
    END IF;
END;
$$;
