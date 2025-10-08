-- ENHANCE: Améliorer get_agent_all_visits_with_filters avec détails de parcelle
-- ============================================================================
-- Objectif: Ajouter le nom de la parcelle et sa localisation détaillée
-- Colonnes ajoutées: plot_name, plot_area, plot_soil_type, plot_water_source
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_agent_all_visits_with_filters(uuid, text) CASCADE;

-- Recréer la fonction avec les détails de parcelle
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
    weather_conditions text,
    -- Nouvelles colonnes pour la parcelle
    plot_name text,
    plot_area numeric,
    plot_soil_type text,
    plot_water_source text,
    plot_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_start_date DATE;
    v_end_date DATE;
    v_status_filter TEXT;
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT profiles.id INTO v_agent_profile_id
    FROM public.profiles
    WHERE profiles.user_id = p_user_id AND profiles.role = 'agent';
    
    -- If agent profile not found, return empty
    IF v_agent_profile_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Déterminer les dates et statut selon le filtre
    CASE p_filter
        WHEN 'today' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE;
            v_status_filter := NULL; -- Tous les statuts
        WHEN 'week' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE + INTERVAL '7 days';
            v_status_filter := NULL;
        WHEN 'month' THEN
            v_start_date := CURRENT_DATE;
            v_end_date := CURRENT_DATE + INTERVAL '30 days';
            v_status_filter := NULL;
        WHEN 'past' THEN
            v_start_date := '1900-01-01'; -- Très loin dans le passé
            v_end_date := CURRENT_DATE - INTERVAL '1 day';
            v_status_filter := NULL;
        WHEN 'future' THEN
            v_start_date := CURRENT_DATE + INTERVAL '1 day';
            v_end_date := '2100-01-01'; -- Très loin dans le futur
            v_status_filter := NULL;
        WHEN 'all' THEN
            v_start_date := '1900-01-01';
            v_end_date := '2100-01-01';
            v_status_filter := NULL;
        WHEN 'completed' THEN -- Nouveau filtre
            v_start_date := '1900-01-01';
            v_end_date := '2100-01-01';
            v_status_filter := 'completed';
        WHEN 'pending' THEN -- Nouveau filtre
            v_start_date := '1900-01-01';
            v_end_date := '2100-01-01';
            v_status_filter := 'scheduled'; -- 'pending' maps to 'scheduled'
        WHEN 'in_progress' THEN -- Nouveau filtre
            v_start_date := '1900-01-01';
            v_end_date := '2100-01-01';
            v_status_filter := 'in_progress';
        ELSE -- Default to 'all' if filter is unknown
            v_start_date := '1900-01-01';
            v_end_date := '2100-01-01';
            v_status_filter := NULL;
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
        COALESCE(v.weather_conditions, '') as weather_conditions,
        -- Nouvelles colonnes pour la parcelle
        COALESCE(pl.name_season_snapshot, 'Parcelle inconnue') as plot_name,
        COALESCE(pl.area_hectares, 0) as plot_area,
        COALESCE(pl.soil_type, 'Non spécifié') as plot_soil_type,
        COALESCE(pl.water_source, 'Non spécifié') as plot_water_source,
        COALESCE(pl.status, 'inconnu') as plot_status
    FROM public.visits v
    LEFT JOIN public.producers p ON v.producer_id = p.id
    LEFT JOIN public.plots pl ON v.plot_id = pl.id
    WHERE v.agent_id = v_agent_profile_id
    AND v.visit_date::date >= v_start_date
    AND v.visit_date::date <= v_end_date
    AND (
        (v_status_filter IS NULL) OR
        (v_status_filter = 'completed' AND v.status = 'completed') OR
        (v_status_filter = 'scheduled' AND v.status = 'scheduled') OR
        (v_status_filter = 'in_progress' AND v.status = 'in_progress')
    )
    ORDER BY v.visit_date ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_agent_all_visits_with_filters(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_agent_all_visits_with_filters(uuid, text) IS 
  'Récupère les visites d''un agent avec filtres de date et statut - Version avec détails de parcelle';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  RPC get_agent_all_visits_with_filters AMÉLIORÉE      ║';
  RAISE NOTICE '║  Nouvelles colonnes: plot_name, plot_area, etc.       ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles colonnes ajoutées:';
  RAISE NOTICE '  ✓ plot_name: Nom de la parcelle';
  RAISE NOTICE '  ✓ plot_area: Superficie en hectares';
  RAISE NOTICE '  ✓ plot_soil_type: Type de sol';
  RAISE NOTICE '  ✓ plot_water_source: Source d''eau';
  RAISE NOTICE '  ✓ plot_status: Statut de la parcelle';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Visites avec informations complètes de parcelle';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
