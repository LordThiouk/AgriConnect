-- Get visit types and improve UI data for visits
-- Add visit types enum and improve the RPC function

-- First, let's check what visit types exist in the database
-- This will help us create a proper enum

-- Create a function to get visit types
CREATE OR REPLACE FUNCTION get_visit_types()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'value', visit_type,
                    'label', CASE 
                        WHEN visit_type = 'planned' THEN 'Visite planifiée'
                        WHEN visit_type = 'follow_up' THEN 'Suivi'
                        WHEN visit_type = 'emergency' THEN 'Urgence'
                        WHEN visit_type = 'inspection' THEN 'Inspection'
                        WHEN visit_type = 'training' THEN 'Formation'
                        WHEN visit_type = 'harvest' THEN 'Récolte'
                        WHEN visit_type = 'planting' THEN 'Plantation'
                        WHEN visit_type = 'treatment' THEN 'Traitement'
                        ELSE INITCAP(visit_type)
                    END,
                    'icon', CASE 
                        WHEN visit_type = 'planned' THEN 'calendar'
                        WHEN visit_type = 'follow_up' THEN 'refresh'
                        WHEN visit_type = 'emergency' THEN 'warning'
                        WHEN visit_type = 'inspection' THEN 'search'
                        WHEN visit_type = 'training' THEN 'school'
                        WHEN visit_type = 'harvest' THEN 'leaf'
                        WHEN visit_type = 'planting' THEN 'seedling'
                        WHEN visit_type = 'treatment' THEN 'medical'
                        ELSE 'list'
                    END,
                    'color', CASE 
                        WHEN visit_type = 'planned' THEN '#3B82F6'
                        WHEN visit_type = 'follow_up' THEN '#10B981'
                        WHEN visit_type = 'emergency' THEN '#EF4444'
                        WHEN visit_type = 'inspection' THEN '#F59E0B'
                        WHEN visit_type = 'training' THEN '#8B5CF6'
                        WHEN visit_type = 'harvest' THEN '#F97316'
                        WHEN visit_type = 'planting' THEN '#22C55E'
                        WHEN visit_type = 'treatment' THEN '#06B6D4'
                        ELSE '#6B7280'
                    END
                )
            ),
            '[]'::json
        )
        FROM (
            SELECT DISTINCT visit_type 
            FROM public.visits 
            WHERE visit_type IS NOT NULL
            ORDER BY visit_type
        ) types
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_visit_types() TO authenticated;

-- Improve the get_agent_today_visits function to include more UI data
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

    -- 3. Return detailed visits data with improved UI information
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
                    'visit_type_label', visit_data.visit_type_label,
                    'visit_type_icon', visit_data.visit_type_icon,
                    'visit_type_color', visit_data.visit_type_color,
                    'visit_date', visit_data.visit_date,
                    'duration_minutes', visit_data.duration_minutes,
                    'notes', visit_data.notes,
                    'weather_conditions', visit_data.weather_conditions,
                    'hasGps', visit_data.has_gps,
                    'plotId', visit_data.plot_id,
                    'plotCoordinates', visit_data.plot_coordinates,
                    'scheduledTime', visit_data.visit_date,
                    'priority', visit_data.priority,
                    'urgency', visit_data.urgency
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
                    CASE 
                        WHEN v.visit_type = 'planned' THEN 'Visite planifiée'
                        WHEN v.visit_type = 'follow_up' THEN 'Suivi'
                        WHEN v.visit_type = 'emergency' THEN 'Urgence'
                        WHEN v.visit_type = 'inspection' THEN 'Inspection'
                        WHEN v.visit_type = 'training' THEN 'Formation'
                        WHEN v.visit_type = 'harvest' THEN 'Récolte'
                        WHEN v.visit_type = 'planting' THEN 'Plantation'
                        WHEN v.visit_type = 'treatment' THEN 'Traitement'
                        ELSE INITCAP(v.visit_type)
                    END as visit_type_label,
                    CASE 
                        WHEN v.visit_type = 'planned' THEN 'calendar'
                        WHEN v.visit_type = 'follow_up' THEN 'refresh'
                        WHEN v.visit_type = 'emergency' THEN 'warning'
                        WHEN v.visit_type = 'inspection' THEN 'search'
                        WHEN v.visit_type = 'training' THEN 'school'
                        WHEN v.visit_type = 'harvest' THEN 'leaf'
                        WHEN v.visit_type = 'planting' THEN 'seedling'
                        WHEN v.visit_type = 'treatment' THEN 'medical'
                        ELSE 'list'
                    END as visit_type_icon,
                    CASE 
                        WHEN v.visit_type = 'planned' THEN '#3B82F6'
                        WHEN v.visit_type = 'follow_up' THEN '#10B981'
                        WHEN v.visit_type = 'emergency' THEN '#EF4444'
                        WHEN v.visit_type = 'inspection' THEN '#F59E0B'
                        WHEN v.visit_type = 'training' THEN '#8B5CF6'
                        WHEN v.visit_type = 'harvest' THEN '#F97316'
                        WHEN v.visit_type = 'planting' THEN '#22C55E'
                        WHEN v.visit_type = 'treatment' THEN '#06B6D4'
                        ELSE '#6B7280'
                    END as visit_type_color,
                    v.visit_date,
                    v.duration_minutes,
                    v.notes,
                    v.weather_conditions,
                    ffp.id IS NOT NULL as has_gps,
                    v.plot_id,
                    CASE 
                        WHEN pl.geom IS NOT NULL THEN 
                            json_build_object(
                                'latitude', ST_Y(ST_Centroid(pl.geom)),
                                'longitude', ST_X(ST_Centroid(pl.geom)),
                                'hasCoordinates', true
                            )
                        ELSE 
                            json_build_object(
                                'latitude', null,
                                'longitude', null,
                                'hasCoordinates', false
                            )
                    END as plot_coordinates,
                    CASE 
                        WHEN v.visit_type = 'emergency' THEN 'high'
                        WHEN v.visit_type = 'inspection' THEN 'medium'
                        ELSE 'normal'
                    END as priority,
                    CASE 
                        WHEN v.visit_type = 'emergency' THEN true
                        ELSE false
                    END as urgency
                FROM public.visits v
                LEFT JOIN public.producers p ON v.producer_id = p.id
                LEFT JOIN public.farm_file_plots ffp ON v.plot_id = ffp.id
                LEFT JOIN public.plots pl ON ffp.plot_id = pl.id
                WHERE v.agent_id = v_agent_profile_id
                  AND DATE(v.visit_date) = v_today_date
                  AND v.status != 'completed'
                ORDER BY 
                    CASE 
                        WHEN v.visit_type = 'emergency' THEN 1
                        WHEN v.visit_type = 'inspection' THEN 2
                        ELSE 3
                    END,
                    v.visit_date ASC
            ) visit_data
        ),
        '[]'::json
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;
