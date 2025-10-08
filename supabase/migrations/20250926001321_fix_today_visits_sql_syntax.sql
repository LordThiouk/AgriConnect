-- Fix get_agent_today_visits SQL syntax error
-- Correct the GROUP BY issue in the function

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
