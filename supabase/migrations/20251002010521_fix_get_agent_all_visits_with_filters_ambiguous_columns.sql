-- ============================================================================
-- FIX: get_agent_all_visits_with_filters - Correction erreur colonnes ambiguës
-- ============================================================================
-- Problème: Erreur "column reference 'id' is ambiguous" dans le RPC
-- Solution: Qualifier explicitement toutes les colonnes avec les alias de table
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_agent_all_visits_with_filters(uuid, text) CASCADE;

-- Recréer la fonction avec les colonnes qualifiées
CREATE OR REPLACE FUNCTION get_agent_all_visits_with_filters(
    p_user_id uuid,
    p_filter text DEFAULT 'today'
)
RETURNS TABLE (
    id uuid,
    producer text,
    producer_id uuid,
    location text,
    status text,
    has_gps boolean,
    plot_id uuid,
    visit_date text,
    duration_minutes integer,
    visit_type text,
    notes text,
    weather_conditions text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT profiles.id INTO v_agent_profile_id
    FROM public.profiles
    WHERE profiles.user_id = p_user_id AND profiles.role = 'agent';
    
    -- If agent profile not found, return empty
    IF v_agent_profile_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Déterminer les dates selon le filtre
    CASE p_filter
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
            -- Par défaut, aujourd'hui
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE;
    END CASE;

    -- 3. Return visits with filters (colonnes qualifiées)
    RETURN QUERY
    SELECT 
        v.id,
        COALESCE(p.first_name || ' ' || p.last_name, 'Producteur inconnu') as producer,
        v.producer_id,
        COALESCE(pl.name_season_snapshot, 'Parcelle inconnue') as location,
        CASE 
            WHEN v.status = 'scheduled' THEN 'à faire'
            WHEN v.status = 'in_progress' THEN 'en cours'
            WHEN v.status = 'completed' THEN 'terminé'
            ELSE 'à faire'
        END as status,
        CASE 
            WHEN pl.geom IS NOT NULL OR pl.center_point IS NOT NULL THEN true 
            ELSE false 
        END as has_gps,
        v.plot_id,
        COALESCE(v.visit_date::text, CURRENT_DATE::text) as visit_date,
        COALESCE(v.duration_minutes, 30) as duration_minutes,
        COALESCE(v.visit_type, 'routine') as visit_type,
        COALESCE(v.notes, '') as notes,
        COALESCE(v.weather_conditions, '') as weather_conditions
    FROM public.visits v
    LEFT JOIN public.producers p ON v.producer_id = p.id
    LEFT JOIN public.plots pl ON v.plot_id = pl.id
    WHERE v.agent_id = p_user_id
    AND v.visit_date::date >= v_start_date
    AND v.visit_date::date <= v_end_date
    ORDER BY v.visit_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_all_visits_with_filters(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_agent_all_visits_with_filters(uuid, text) IS 
  'Récupère les visites d''un agent avec filtres de date (today, week, month, past, future, all) - Version corrigée';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  RPC get_agent_all_visits_with_filters CORRIGÉE       ║';
  RAISE NOTICE '║  Correction: colonnes qualifiées pour éviter ambiguïté ║';
  RAISE NOTICE '║  Filtres: today, week, month, past, future, all        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
