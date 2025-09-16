-- Update get_agent_dashboard_stats to remove dependency on the non-existent 'status' column.
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

    -- 3. Count all plots for these producers from the referential
    SELECT COUNT(*)
    INTO v_plots_count
    FROM public.plots
    WHERE producer_id = ANY(v_producer_ids);

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
        'activePlotsCount', v_plots_count, -- Renamed for clarity, but frontend expects activePlotsCount
        'completedFilesPercent', v_completed_files_percent
    );
END;
$$;

-- Update get_agent_today_visits to remove dependency on the non-existent 'status' column.
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
                'id', p.id,
                'producer', pr.first_name || ' ' || pr.last_name,
                'location', p.name, -- Using plot name as location for now
                'status', 'à faire',
                'hasGps', p.geom IS NOT NULL,
                'plotId', p.id
            )
        ), '[]'::json)
        FROM public.plots p
        JOIN public.producers pr ON p.producer_id = pr.id
        WHERE p.producer_id = ANY(v_producer_ids)
          AND NOT EXISTS (
              SELECT 1
              FROM public.operations op
              WHERE op.plot_id = p.id
                AND op.operation_type = 'reconnaissance'
                AND op.operation_date >= CURRENT_DATE
          )
    );
END;
$$;
