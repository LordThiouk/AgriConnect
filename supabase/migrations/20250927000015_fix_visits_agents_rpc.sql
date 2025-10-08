-- Migration: Correction des RPC visites/agents pour utiliser la nouvelle table agent_assignments
-- Objectif: Mettre à jour toutes les fonctions qui référencent agent_producer_assignments

-- 1. Corriger get_agent_today_visits pour utiliser agent_assignments
DROP FUNCTION IF EXISTS get_agent_today_visits(uuid);
CREATE OR REPLACE FUNCTION get_agent_today_visits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_today_date DATE;
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT id INTO v_agent_profile_id
    FROM public.profiles
    WHERE user_id = p_user_id AND role = 'agent';
    
    -- If agent profile not found, return empty array
    IF v_agent_profile_id IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- 2. Get today's date
    v_today_date := CURRENT_DATE;

    -- 3. Return visits from the visits table for today that are not completed
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', v.id,
                'producer', CONCAT(p.first_name, ' ', p.last_name),
                'location', COALESCE(ffp.name_season_snapshot, 'Localisation non spécifiée'),
                'status', CASE 
                    WHEN v.status = 'completed' THEN 'terminé'
                    WHEN v.status = 'in_progress' THEN 'en cours'
                    ELSE 'à faire'
                END,
                'hasGps', ffp.id IS NOT NULL,
                'plotId', v.plot_id,
                'scheduledTime', v.visit_date
            )
        ), '[]'::json)
        FROM public.visits v
        LEFT JOIN public.producers p ON v.producer_id = p.id
        LEFT JOIN public.farm_file_plots ffp ON v.plot_id = ffp.id
        WHERE v.agent_id = v_agent_profile_id
          AND DATE(v.visit_date) = v_today_date
          AND v.status != 'completed'  -- Filter out completed visits
        ORDER BY v.visit_date ASC
    );
END;
$$;

-- 2. Créer une fonction pour vérifier si un agent est assigné à un producteur
CREATE OR REPLACE FUNCTION is_agent_assigned_to_producer(p_agent_id uuid, p_producer_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier les assignations directes producteur
    IF EXISTS (
        SELECT 1 FROM public.agent_assignments 
        WHERE agent_id = p_agent_id 
        AND assigned_to_type = 'producer' 
        AND assigned_to_id = p_producer_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier les assignations via coopérative
    IF EXISTS (
        SELECT 1 FROM public.agent_assignments aa
        JOIN public.producers p ON aa.assigned_to_id = p.cooperative_id
        WHERE aa.agent_id = p_agent_id 
        AND aa.assigned_to_type = 'cooperative' 
        AND p.id = p_producer_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 3. Créer une fonction pour obtenir les producteurs assignés à un agent (pour les visites)
CREATE OR REPLACE FUNCTION get_agent_assigned_producers_for_visits(p_agent_id uuid)
RETURNS TABLE(producer_id uuid, producer_name text, cooperative_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Producteurs assignés directement
    SELECT 
        p.id as producer_id,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name,
        p.cooperative_id
    FROM public.producers p
    JOIN public.agent_assignments aa ON aa.assigned_to_id = p.id
    WHERE aa.agent_id = p_agent_id 
    AND aa.assigned_to_type = 'producer'
    
    UNION
    
    -- Producteurs assignés via coopérative
    SELECT 
        p.id as producer_id,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name,
        p.cooperative_id
    FROM public.producers p
    JOIN public.agent_assignments aa ON aa.assigned_to_id = p.cooperative_id
    WHERE aa.agent_id = p_agent_id 
    AND aa.assigned_to_type = 'cooperative'
    
    ORDER BY producer_name;
END;
$$;

-- 4. Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_agent_assigned_to_producer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_assigned_producers_for_visits(uuid) TO authenticated;
