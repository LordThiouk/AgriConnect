-- Améliorer la fonction get_agent_terrain_alerts pour inclure le nom de la parcelle
CREATE OR REPLACE FUNCTION get_agent_terrain_alerts(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_producer_ids UUID[];
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT id INTO v_agent_profile_id
    FROM public.profiles
    WHERE user_id = p_user_id AND role = 'agent';

    -- If agent profile not found, return empty array
    IF v_agent_profile_id IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- 2. Get all producer IDs assigned to the agent
    SELECT array_agg(producer_id)
    INTO v_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = v_agent_profile_id;

    -- If no producers are assigned, return an empty array
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN '[]'::json;
    END IF;

    -- 3. Find observations with high severity (>= 3) for these producers
    -- Use a subquery to avoid GROUP BY issues
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', subq.id,
                'title', subq.title,
                'description', subq.description,
                'severity', subq.severity,
                'plotId', subq.plot_id,
                'plotName', subq.plot_name, -- Added plot name
                'producerName', subq.producer_name,
                'producerId', subq.producer_id, -- Added producer ID
                'createdAt', subq.created_at
            )
        ), '[]'::json)
        FROM (
            SELECT
                o.id,
                CASE
                    WHEN o.observation_type = 'ravageur' THEN 'Alerte ravageur'
                    WHEN o.observation_type = 'maladie' THEN 'Alerte maladie'
                    WHEN o.observation_type = 'levée' THEN 'Problème de levée'
                    ELSE 'Alerte terrain'
                END as title,
                o.description,
                CASE
                    WHEN o.severity >= 4 THEN 'high'
                    ELSE 'medium'
                END as severity,
                o.plot_id,
                ffp.name_season_snapshot as plot_name, -- Added plot name
                pr.first_name || ' ' || pr.last_name as producer_name,
                pr.id as producer_id, -- Added producer ID
                o.created_at
            FROM public.observations o
            JOIN public.farm_file_plots ffp ON o.plot_id = ffp.id
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            JOIN public.producers pr ON ff.responsible_producer_id = pr.id
            WHERE ff.responsible_producer_id = ANY(v_producer_ids)
              AND o.severity >= 3
              AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY o.severity DESC, o.created_at DESC
            LIMIT 10
        ) subq
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_agent_terrain_alerts(uuid) TO authenticated;
