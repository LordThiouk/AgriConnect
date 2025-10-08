-- ============================================================================
-- FIX: get_agent_today_visits - Correction des colonnes
-- ============================================================================
-- Problème: Utilisation de assigned_by_id au lieu de agent_id
-- Solution: Utiliser les bonnes colonnes de la table agent_assignments
-- ============================================================================

DROP FUNCTION IF EXISTS get_agent_today_visits(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_agent_today_visits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_producer_ids UUID[];
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT id INTO v_agent_profile_id
    FROM public.profiles
    WHERE user_id = p_user_id AND role = 'agent';
    
    -- If agent profile not found, return empty array
    IF v_agent_profile_id IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- 2. Get all producer IDs assigned to the agent via agent_assignments
    SELECT array_agg(assigned_to_id)
    INTO v_producer_ids
    FROM public.agent_assignments
    WHERE agent_id = p_user_id  -- Utiliser agent_id directement (user_id)
    AND assigned_to_type = 'producer';
    
    -- If no producers assigned, return empty array
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- 3. Return REAL visits from the visits table for today
    RETURN (
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
                    WHEN pl.location IS NOT NULL THEN true 
                    ELSE false 
                END,
                'plotId', v.plot_id,
                'visit_date', COALESCE(v.visit_date::text, CURRENT_DATE::text),
                'duration_minutes', COALESCE(v.duration_minutes, 30)
            )
        ), '[]'::json)
        FROM public.visits v
        LEFT JOIN public.producers p ON v.producer_id = p.id
        LEFT JOIN public.plots pl ON v.plot_id = pl.id
        WHERE v.agent_id = p_user_id
        AND v.visit_date::date = CURRENT_DATE
        ORDER BY v.visit_date ASC
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;

COMMENT ON FUNCTION get_agent_today_visits(uuid) IS 
  'Récupère les VRAIES visites du jour pour un agent depuis la table visits.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      RPC VISITES CORRIGÉ - COLONNES CORRECTES         ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ Utilise agent_id au lieu de assigned_by_id';
  RAISE NOTICE '  ✓ Filtre directement par agent_id = p_user_id';
  RAISE NOTICE '  ✓ Retourne de vraies visites depuis la table visits';
  RAISE NOTICE '  ✓ Jointure avec producers et plots pour les détails';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Les IDs retournés sont maintenant de vrais IDs de visites';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
