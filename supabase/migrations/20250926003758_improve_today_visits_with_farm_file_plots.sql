-- Improve get_agent_today_visits to use farm_file_plots instead of plots
-- Include more detailed data for better display and modal

CREATE OR REPLACE FUNCTION get_agent_today_visits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_today_date DATE;
    v_result json;
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

    -- 3. Return detailed visits data using farm_file_plots
    SELECT COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', visit_data.id,
                    'producer', visit_data.producer_name,
                    'producer_phone', visit_data.producer_phone,
                    'location', visit_data.location_name,
                    'plot_area', visit_data.plot_area,
                    'status', visit_data.status_display,
                    'visit_type', visit_data.visit_type,
                    'visit_date', visit_data.visit_date,
                    'duration_minutes', visit_data.duration_minutes,
                    'notes', visit_data.notes,
                    'weather_conditions', visit_data.weather_conditions,
                    'hasGps', visit_data.has_gps,
                    'plotId', visit_data.plot_id,
                    'scheduledTime', visit_data.visit_date
                )
            )
            FROM (
                SELECT 
                    v.id,
                    CONCAT(p.first_name, ' ', p.last_name) as producer_name,
                    p.phone as producer_phone,
                    COALESCE(ffp.name_season_snapshot, 'Localisation non spécifiée') as location_name,
                    ffp.area_hectares as plot_area,
                    CASE 
                        WHEN v.status = 'completed' THEN 'terminé'
                        WHEN v.status = 'in_progress' THEN 'en cours'
                        ELSE 'à faire'
                    END as status_display,
                    v.visit_type,
                    v.visit_date,
                    v.duration_minutes,
                    v.notes,
                    v.weather_conditions,
                    ffp.id IS NOT NULL as has_gps,
                    v.plot_id
                FROM public.visits v
                LEFT JOIN public.producers p ON v.producer_id = p.id
                LEFT JOIN public.farm_file_plots ffp ON v.plot_id = ffp.id
                WHERE v.agent_id = v_agent_profile_id
                  AND DATE(v.visit_date) = v_today_date
                  AND v.status != 'completed'
                ORDER BY v.visit_date ASC
            ) visit_data
        ),
        '[]'::json
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
