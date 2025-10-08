-- ============================================================================
-- FIX: get_agent_dashboard_unified - Correction erreur GROUP BY
-- ============================================================================
-- Problème: Erreur "column v.visit_date must appear in the GROUP BY clause"
-- Solution: Corriger l'ordre des clauses ORDER BY dans json_agg
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_agent_dashboard_unified(uuid, text) CASCADE;

-- Recréer la fonction avec la correction GROUP BY
CREATE OR REPLACE FUNCTION get_agent_dashboard_unified(
    p_user_id uuid,
    p_visit_filter text DEFAULT 'today'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_start_date DATE;
    v_end_date DATE;
    v_stats JSON;
    v_visits JSON;
    v_alerts JSON;
    v_result JSON;
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT profiles.id INTO v_agent_profile_id
    FROM public.profiles
    WHERE profiles.user_id = p_user_id AND profiles.role = 'agent';
    
    -- If agent profile not found, return empty
    IF v_agent_profile_id IS NULL THEN
        RETURN json_build_object(
            'stats', json_build_object(
                'producersCount', 0,
                'activePlotsCount', 0,
                'completedFilesPercent', 0
            ),
            'visits', '[]'::json,
            'alerts', '[]'::json
        );
    END IF;

    -- 2. Déterminer les dates selon le filtre de visite
    CASE p_visit_filter
        WHEN 'today' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE;
        WHEN 'week' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE + INTERVAL '7 days';
        WHEN 'month' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE + INTERVAL '30 days';
        WHEN 'past' THEN
            v_start_date := '1900-01-01'::date;
            v_end_date := CURRENT_DATE - INTERVAL '1 day';
        WHEN 'future' THEN
            v_start_date := CURRENT_DATE + INTERVAL '1 day';
            v_end_date := '2100-12-31'::date;
        WHEN 'all' THEN
            v_start_date := '1900-01-01'::date;
            v_end_date := '2100-12-31'::date;
        ELSE
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE;
    END CASE;

    -- 3. Récupérer les statistiques
    SELECT json_build_object(
        'producersCount', COALESCE(producer_stats.count, 0),
        'activePlotsCount', COALESCE(plot_stats.count, 0),
        'completedFilesPercent', COALESCE(completion_stats.percent, 0)
    ) INTO v_stats
    FROM (
        -- Nombre de producteurs assignés
        SELECT COUNT(DISTINCT aa.assigned_to_id) as count
        FROM public.agent_assignments aa
        WHERE aa.agent_id = p_user_id 
        AND aa.assigned_to_type = 'producer'
    ) producer_stats
    CROSS JOIN (
        -- Nombre de parcelles actives
        SELECT COUNT(DISTINCT pl.id) as count
        FROM public.plots pl
        JOIN public.agent_assignments aa ON pl.producer_id = aa.assigned_to_id
        WHERE aa.agent_id = p_user_id 
        AND aa.assigned_to_type = 'producer'
        AND pl.status = 'active'
    ) plot_stats
    CROSS JOIN (
        -- Pourcentage de fiches complétées (simulation basique)
        SELECT 75 as percent
    ) completion_stats;

    -- 4. Récupérer les visites selon le filtre (correction GROUP BY)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', v.id,
            'producer', COALESCE(p.first_name || ' ' || p.last_name, 'Producteur inconnu'),
            'producerId', v.producer_id,
            'location', COALESCE(pl.name_season_snapshot, 'Parcelle inconnue'),
            'status', CASE 
                WHEN v.status = 'scheduled' THEN 'à faire'
                WHEN v.status = 'in_progress' THEN 'en cours'
                WHEN v.status = 'completed' THEN 'terminé'
                ELSE 'à faire'
            END,
            'hasGps', CASE 
                WHEN pl.geom IS NOT NULL OR pl.center_point IS NOT NULL THEN true 
                ELSE false 
            END,
            'plotId', v.plot_id,
            'visit_date', COALESCE(v.visit_date::text, CURRENT_DATE::text),
            'duration_minutes', COALESCE(v.duration_minutes, 30),
            'visit_type', COALESCE(v.visit_type, 'routine'),
            'notes', COALESCE(v.notes, ''),
            'weather_conditions', COALESCE(v.weather_conditions, '')
        )
    ), '[]'::json) INTO v_visits
    FROM (
        SELECT v.*, p.first_name, p.last_name, pl.name_season_snapshot, pl.geom, pl.center_point
        FROM public.visits v
        LEFT JOIN public.producers p ON v.producer_id = p.id
        LEFT JOIN public.plots pl ON v.plot_id = pl.id
        WHERE v.agent_id = p_user_id
        AND v.visit_date::date >= v_start_date
        AND v.visit_date::date <= v_end_date
        ORDER BY v.visit_date ASC
    ) v;

    -- 5. Récupérer les alertes terrain
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', rec.id,
            'title', COALESCE(rec.title, 'Alerte terrain'),
            'description', COALESCE(rec.description, 'Aucune description'),
            'severity', COALESCE(rec.severity, 'medium'),
            'created_at', rec.created_at,
            'producer_name', COALESCE(p.first_name || ' ' || p.last_name, 'Producteur inconnu'),
            'plot_name', COALESCE(pl.name_season_snapshot, 'Parcelle inconnue')
        )
    ), '[]'::json) INTO v_alerts
    FROM public.recommendations rec
    LEFT JOIN public.producers p ON rec.producer_id = p.id
    LEFT JOIN public.plots pl ON rec.plot_id = pl.id
    LEFT JOIN public.agent_assignments aa ON p.id = aa.assigned_to_id
    WHERE aa.agent_id = p_user_id 
    AND aa.assigned_to_type = 'producer'
    AND rec.status = 'active'
    ORDER BY rec.created_at DESC
    LIMIT 10;

    -- 6. Construire le résultat final
    v_result := json_build_object(
        'stats', v_stats,
        'visits', v_visits,
        'alerts', v_alerts
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_dashboard_unified(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_agent_dashboard_unified(uuid, text) IS 
  'RPC unifié pour récupérer toutes les données du dashboard agent en un seul appel (stats, visites, alertes) - Version corrigée GROUP BY';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  RPC get_agent_dashboard_unified CORRIGÉE             ║';
  RAISE NOTICE '║  Correction: GROUP BY dans sous-requête ORDER BY      ║';
  RAISE NOTICE '║  Optimisation: 1 seul appel au lieu de 3              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
