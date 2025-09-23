-- Fix dashboard RPC functions to work with the current database structure
-- The functions need to use farm_file_plots instead of plots.producer_id

-- Update get_agent_dashboard_stats to use farm_file_plots
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producers_count INT;
    v_plots_count INT;
    v_farm_files_count INT;
    v_completed_files_count INT;
    v_completed_files_percent INT;
    v_producer_ids UUID[];
BEGIN
    -- 1. Get all producer IDs assigned to the agent
    SELECT array_agg(producer_id)
    INTO v_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = p_agent_id;

    -- If no producers are assigned, return zeros
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN json_build_object(
            'producersCount', 0,
            'activePlotsCount', 0,
            'completedFilesPercent', 0
        );
    END IF;

    -- 2. Count the number of assigned producers
    v_producers_count := array_length(v_producer_ids, 1);

    -- 3. Count all plots for these producers via farm_file_plots
    SELECT COUNT(DISTINCT ffp.plot_id)
    INTO v_plots_count
    FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ff.responsible_producer_id = ANY(v_producer_ids);

    -- 4. Calculate the percentage of completed farm files
    SELECT COUNT(*)
    INTO v_farm_files_count
    FROM public.farm_files
    WHERE responsible_producer_id = ANY(v_producer_ids);

    IF v_farm_files_count > 0 THEN
        -- A completed file is now defined by its status field.
        SELECT COUNT(*)
        INTO v_completed_files_count
        FROM public.farm_files
        WHERE responsible_producer_id = ANY(v_producer_ids) AND status = 'completed';
        
        v_completed_files_percent := floor((v_completed_files_count::decimal / v_farm_files_count::decimal) * 100);
    ELSE
        v_completed_files_percent := 0;
    END IF;

    -- 5. Return all stats as a single JSON object
    RETURN json_build_object(
        'producersCount', v_producers_count,
        'activePlotsCount', v_plots_count,
        'completedFilesPercent', v_completed_files_percent
    );
END;
$$;

-- Update get_agent_today_visits to use farm_file_plots
CREATE OR REPLACE FUNCTION get_agent_today_visits(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producer_ids UUID[];
BEGIN
    -- 1. Get all producer IDs assigned to the agent
    SELECT array_agg(producer_id)
    INTO v_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = p_agent_id;

    -- If no producers are assigned, return an empty array
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN '[]'::json;
    END IF;

    -- 2. Find all plots for these producers that have NOT had a 'reconnaissance' operation today
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', ffp.id,
                'producer', pr.first_name || ' ' || pr.last_name,
                'location', p.name,
                'status', 'à faire',
                'hasGps', p.geom IS NOT NULL,
                'plotId', ffp.id
            )
        ), '[]'::json)
        FROM public.farm_file_plots ffp
        JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
        JOIN public.plots p ON ffp.plot_id = p.id
        JOIN public.producers pr ON ff.responsible_producer_id = pr.id
        WHERE ff.responsible_producer_id = ANY(v_producer_ids)
          AND NOT EXISTS (
              SELECT 1
              FROM public.operations op
              WHERE op.plot_id = ffp.id
                AND op.operation_type = 'reconnaissance'
                AND op.operation_date >= CURRENT_DATE
          )
    );
END;
$$;

-- Update get_agent_terrain_alerts to use farm_file_plots
CREATE OR REPLACE FUNCTION get_agent_terrain_alerts(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producer_ids UUID[];
BEGIN
    -- 1. Get all producer IDs assigned to the agent
    SELECT array_agg(producer_id)
    INTO v_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = p_agent_id;

    -- If no producers are assigned, return an empty array
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN '[]'::json;
    END IF;

    -- 2. Find observations with high severity (>= 4) for these producers
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', o.id,
                'title', CASE 
                    WHEN o.observation_type = 'ravageur' THEN 'Alerte ravageur'
                    WHEN o.observation_type = 'maladie' THEN 'Alerte maladie'
                    WHEN o.observation_type = 'levée' THEN 'Problème de levée'
                    ELSE 'Alerte terrain'
                END,
                'description', o.description,
                'severity', CASE 
                    WHEN o.severity >= 4 THEN 'high'
                    ELSE 'medium'
                END,
                'plotId', o.plot_id,
                'producerName', pr.first_name || ' ' || pr.last_name,
                'createdAt', o.created_at
            )
        ), '[]'::json)
        FROM public.observations o
        JOIN public.farm_file_plots ffp ON o.plot_id = ffp.id
        JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
        JOIN public.producers pr ON ff.responsible_producer_id = pr.id
        WHERE ff.responsible_producer_id = ANY(v_producer_ids)
          AND o.severity >= 3
          AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY o.severity DESC, o.created_at DESC
        LIMIT 10
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_terrain_alerts(uuid) TO authenticated;
