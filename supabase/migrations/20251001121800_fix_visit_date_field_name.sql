-- ============================================================================
-- FIX: Corriger le nom du champ date dans get_agent_today_visits
-- ============================================================================
-- Problème: Le RPC retourne "date" et "visitDate" mais le mobile cherche "visit_date"
-- Solution: Retourner "visit_date" pour correspondre à la convention de nommage
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
    WHERE agent_id = v_agent_profile_id
      AND assigned_to_type = 'producer';

    -- If no producers are assigned, return an empty array
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN '[]'::json;
    END IF;

    -- 3. Find all plots for these producers that have NOT had a 'reconnaissance' operation today
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', plt.id,
                'producer', pr.first_name || ' ' || pr.last_name,
                'producerId', pr.id,
                'location', plt.name_season_snapshot,
                'status', 'à faire',
                'hasGps', plt.center_point IS NOT NULL,
                'plotId', plt.id,
                'visit_date', CURRENT_DATE::text,
                'duration_minutes', 30
            )
        ), '[]'::json)
        FROM public.plots plt
        JOIN public.producers pr ON plt.producer_id = pr.id
        WHERE pr.id = ANY(v_producer_ids)
          AND NOT EXISTS (
              SELECT 1
              FROM public.operations op
              WHERE op.plot_id = plt.id
                AND op.operation_type = 'reconnaissance'
                AND op.operation_date >= CURRENT_DATE
          )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;

COMMENT ON FUNCTION get_agent_today_visits(uuid) IS 
  'Récupère les visites du jour pour un agent. Utilise agent_assignments + plots. Retourne visit_date au format string.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      CHAMP visit_date CORRIGÉ                         ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ Renommé "date" → "visit_date"';
  RAISE NOTICE '  ✓ Renommé "visitDate" → "visit_date"';
  RAISE NOTICE '  ✓ Format: CURRENT_DATE::text (ISO 8601)';
  RAISE NOTICE '  ✓ Ajout duration_minutes par défaut: 30';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Le mobile devrait afficher les dates correctement !';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

