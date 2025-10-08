-- Drop old version of get_agent_today_visits function that might be causing conflicts
-- and ensure we have the correct version with user_id parameter

-- Drop any existing versions
DROP FUNCTION IF EXISTS get_agent_today_visits();
DROP FUNCTION IF EXISTS get_agent_today_visits(uuid);

-- Recreate the correct version
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

    -- 3. Build the result using a subquery to avoid GROUP BY issues
    SELECT COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', visit_data.id,
                    'producer', visit_data.producer_name,
                    'location', visit_data.location_name,
                    'status', visit_data.status_display,
                    'hasGps', visit_data.has_gps,
                    'plotId', visit_data.plot_id,
                    'scheduledTime', visit_data.visit_date
                )
            )
            FROM (
                SELECT 
                    v.id,
                    CONCAT(p.first_name, ' ', p.last_name) as producer_name,
                    COALESCE(ffp.name_season_snapshot, 'Localisation non spécifiée') as location_name,
                    CASE 
                        WHEN v.status = 'completed' THEN 'terminé'
                        WHEN v.status = 'in_progress' THEN 'en cours'
                        ELSE 'à faire'
                    END as status_display,
                    ffp.id IS NOT NULL as has_gps,
                    v.plot_id,
                    v.visit_date
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
