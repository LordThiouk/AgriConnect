-- =============================================
-- Author:      AgriConnect Team
-- Create date: 2025-09-10
-- Description: Creates a RPC function to get agent dashboard stats.
-- =============================================
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producers_count INT;
    v_active_plots_count INT;
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

    -- 3. Count active plots for these producers
    SELECT COUNT(*)
    INTO v_active_plots_count
    FROM public.plots
    WHERE producer_id = ANY(v_producer_ids) AND status = 'active';

    -- 4. Calculate the percentage of completed farm files
    -- A file is considered "completed" if it has at least one plot associated.
    -- This logic might need refinement based on business rules.
    SELECT COUNT(*)
    INTO v_farm_files_count
    FROM public.farm_files
    WHERE responsible_producer_id = ANY(v_producer_ids);

    IF v_farm_files_count > 0 THEN
        SELECT COUNT(DISTINCT ff.id)
        INTO v_completed_files_count
        FROM public.farm_files ff
        JOIN public.plots p ON ff.responsible_producer_id = p.producer_id
        WHERE ff.responsible_producer_id = ANY(v_producer_ids);
        
        v_completed_files_percent := floor((v_completed_files_count::decimal / v_farm_files_count::decimal) * 100);
    ELSE
        v_completed_files_percent := 0;
    END IF;

    -- 5. Return all stats as a single JSON object
    RETURN json_build_object(
        'producersCount', v_producers_count,
        'activePlotsCount', v_active_plots_count,
        'completedFilesPercent', v_completed_files_percent
    );
END;
$$;
