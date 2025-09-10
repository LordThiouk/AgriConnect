-- =============================================
-- Author:      AgriConnect Team
-- Create date: 2025-09-10
-- Description: Creates a RPC function to get the visits of the day for an agent.
-- =============================================
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

    -- 2. Find all active plots for these producers that have NOT had a 'reconnaissance' operation today
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', p.id,
                'producer', pr.first_name || ' ' || pr.last_name,
                'location', p.name, -- Using plot name as location for now
                'status', 'à faire',
                'hasGps', p.geom IS NOT NULL,
                'plotId', p.id
            )
        )
        FROM public.plots p
        JOIN public.producers pr ON p.producer_id = pr.id
        WHERE p.producer_id = ANY(v_producer_ids)
          AND p.status = 'active'
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
