-- ============================================================================
-- FIX: Mise à jour des fonctions RPC dashboard
-- ============================================================================
-- Problèmes:
--   1. get_agent_dashboard_stats utilise agent_producer_assignments et farm_file_plots
--   2. get_agent_today_visits utilise agent_producer_assignments et farm_file_plots
-- Solution: Utiliser agent_assignments + plots
-- ============================================================================

-- 1. FIX: get_agent_dashboard_stats
-- ============================================================================

DROP FUNCTION IF EXISTS get_agent_dashboard_stats(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_producers_count INT;
    v_plots_count INT;
    v_farm_files_count INT;
    v_completed_files_count INT;
    v_completed_files_percent INT;
    v_producer_ids UUID[];
BEGIN
    -- 1. Get the agent profile ID from user_id
    SELECT id INTO v_agent_profile_id
    FROM public.profiles
    WHERE user_id = p_user_id AND role = 'agent';
    
    -- If agent profile not found, return zeros
    IF v_agent_profile_id IS NULL THEN
        RETURN json_build_object(
            'producersCount', 0,
            'activePlotsCount', 0,
            'completedFilesPercent', 0
        );
    END IF;

    -- 2. Get all producer IDs assigned to the agent via agent_assignments
    SELECT array_agg(assigned_to_id)
    INTO v_producer_ids
    FROM public.agent_assignments
    WHERE agent_id = v_agent_profile_id
      AND assigned_to_type = 'producer';

    -- If no producers are assigned, return zeros
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN json_build_object(
            'producersCount', 0,
            'activePlotsCount', 0,
            'completedFilesPercent', 0
        );
    END IF;

    -- 3. Count the number of assigned producers
    v_producers_count := array_length(v_producer_ids, 1);

    -- 4. Count all plots for these producers directly from plots table
    SELECT COUNT(*)
    INTO v_plots_count
    FROM public.plots
    WHERE producer_id = ANY(v_producer_ids);

    -- 5. Calculate the percentage of completed farm files
    SELECT COUNT(*)
    INTO v_farm_files_count
    FROM public.farm_files
    WHERE responsible_producer_id = ANY(v_producer_ids);

    IF v_farm_files_count > 0 THEN
        SELECT COUNT(*)
        INTO v_completed_files_count
        FROM public.farm_files
        WHERE responsible_producer_id = ANY(v_producer_ids) 
          AND status IN ('completed', 'validated');
        
        v_completed_files_percent := floor((v_completed_files_count::decimal / v_farm_files_count::decimal) * 100);
    ELSE
        v_completed_files_percent := 0;
    END IF;

    -- 6. Return all stats as a single JSON object
    RETURN json_build_object(
        'producersCount', v_producers_count,
        'activePlotsCount', v_plots_count,
        'completedFilesPercent', v_completed_files_percent
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats(uuid) TO authenticated;

COMMENT ON FUNCTION get_agent_dashboard_stats(uuid) IS 
  'Récupère les statistiques dashboard pour un agent. Utilise agent_assignments + plots.';

-- 2. FIX: get_agent_today_visits (si pas déjà corrigée)
-- ============================================================================
-- Note: Cette fonction a déjà été corrigée dans migration 115000, mais on la recrée
--       pour s'assurer qu'elle n'utilise pas agent_producer_assignments

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
                'location', plt.name_season_snapshot,
                'status', 'à faire',
                'hasGps', plt.center_point IS NOT NULL,
                'plotId', plt.id
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
  'Récupère les visites du jour pour un agent. Utilise agent_assignments + plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTIONS DASHBOARD CORRIGÉES                    ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ get_agent_dashboard_stats';
  RAISE NOTICE '  ✓ get_agent_today_visits';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • agent_producer_assignments → agent_assignments';
  RAISE NOTICE '  • farm_file_plots → plots';
  RAISE NOTICE '  • farm_files.responsible_producer_id → plots.producer_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 28 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

