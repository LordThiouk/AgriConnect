-- Migration: Correction des fonctions RPC manquantes et des erreurs
-- Objectif: Créer les fonctions manquantes et corriger les erreurs SQL

-- 1. Supprimer l'ancienne fonction si elle existe et créer la nouvelle
DROP FUNCTION IF EXISTS assign_agent_to_producer(uuid, uuid);
CREATE OR REPLACE FUNCTION assign_agent_to_producer(p_agent_id uuid, p_producer_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insérer l'assignation dans la table unifiée
    INSERT INTO public.agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_at)
    VALUES (p_agent_id, 'producer', p_producer_id, NOW())
    ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- 2. Corriger la fonction get_agent_today_visits (problème GROUP BY)
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
    -- Corriger le problème GROUP BY en utilisant une sous-requête
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', visit_data.id,
                'producer', visit_data.producer_name,
                'location', visit_data.location,
                'status', visit_data.status,
                'hasGps', visit_data.has_gps,
                'plotId', visit_data.plot_id,
                'scheduledTime', visit_data.scheduled_time
            )
        ), '[]'::json)
        FROM (
            SELECT 
                v.id,
                CONCAT(p.first_name, ' ', p.last_name) as producer_name,
                COALESCE(ffp.name_season_snapshot, 'Localisation non spécifiée') as location,
                CASE 
                    WHEN v.status = 'completed' THEN 'terminé'
                    WHEN v.status = 'in_progress' THEN 'en cours'
                    ELSE 'à faire'
                END as status,
                ffp.id IS NOT NULL as has_gps,
                v.plot_id,
                v.visit_date as scheduled_time
            FROM public.visits v
            LEFT JOIN public.producers p ON v.producer_id = p.id
            LEFT JOIN public.farm_file_plots ffp ON v.plot_id = ffp.id
            WHERE v.agent_id = v_agent_profile_id
              AND DATE(v.visit_date) = v_today_date
              AND v.status != 'completed'
            ORDER BY v.visit_date ASC
        ) as visit_data
    );
END;
$$;

-- 3. Supprimer l'ancienne fonction si elle existe et créer la nouvelle
DROP FUNCTION IF EXISTS assign_agent_to_cooperative(uuid, uuid);
CREATE OR REPLACE FUNCTION assign_agent_to_cooperative(p_agent_id uuid, p_cooperative_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insérer l'assignation dans la table unifiée
    INSERT INTO public.agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_at)
    VALUES (p_agent_id, 'cooperative', p_cooperative_id, NOW())
    ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- 4. Supprimer l'ancienne fonction si elle existe et créer la nouvelle
DROP FUNCTION IF EXISTS remove_agent_assignment(uuid, text, uuid);
CREATE OR REPLACE FUNCTION remove_agent_assignment(p_agent_id uuid, p_assigned_to_type text, p_assigned_to_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Supprimer l'assignation
    DELETE FROM public.agent_assignments 
    WHERE agent_id = p_agent_id 
    AND assigned_to_type = p_assigned_to_type::text
    AND assigned_to_id = p_assigned_to_id;
    
    RETURN TRUE;
END;
$$;

-- 5. Supprimer l'ancienne fonction si elle existe et créer la nouvelle
DROP FUNCTION IF EXISTS get_agent_assignments(uuid);
CREATE OR REPLACE FUNCTION get_agent_assignments(p_agent_id uuid)
RETURNS TABLE(
  id uuid,
  assigned_to_type text,
  assigned_to_id uuid,
  assigned_at timestamptz,
  assigned_by uuid,
  assigned_to_name text,
  assigned_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.assigned_to_type,
        aa.assigned_to_id,
        aa.assigned_at,
        aa.assigned_by,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                CONCAT(p.first_name, ' ', p.last_name)
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.name
            ELSE 'Inconnu'
        END as assigned_to_name,
        CASE 
            WHEN aa.assigned_by IS NOT NULL THEN 
                CONCAT(pb.first_name, ' ', pb.last_name)
            ELSE NULL
        END as assigned_by_name
    FROM public.agent_assignments aa
    LEFT JOIN public.producers p ON aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p.id
    LEFT JOIN public.cooperatives c ON aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id
    LEFT JOIN public.profiles pb ON aa.assigned_by = pb.id
    WHERE aa.agent_id = p_agent_id
    ORDER BY aa.assigned_at DESC;
END;
$$;

-- 6. Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION assign_agent_to_producer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_agent_to_cooperative(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_agent_assignment(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_assignments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
