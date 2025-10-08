-- ============================================================================
-- FIX: Mise à jour get_agent_terrain_alerts
-- ============================================================================
-- Problèmes:
--   1. Utilise agent_producer_assignments (remplacée par agent_assignments)
--   2. Utilise farm_file_plots (renommée en plots)
--   3. Utilise farm_files (pas nécessaire avec plots.producer_id)
-- Solution: Utiliser agent_assignments + plots
-- ============================================================================

DROP FUNCTION IF EXISTS get_agent_terrain_alerts(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_agent_terrain_alerts(p_user_id uuid)
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

    -- 3. Find observations with high severity (>= 3) for these producers
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', subq.id,
                'title', subq.title,
                'description', subq.description,
                'severity', subq.severity,
                'plotId', subq.plot_id,
                'plotName', subq.plot_name,
                'producerName', subq.producer_name,
                'producerId', subq.producer_id,
                'createdAt', subq.created_at
            )
        ), '[]'::json)
        FROM (
            SELECT
                o.id,
                CASE
                    WHEN o.observation_type = 'ravageur' THEN 'Alerte ravageur'
                    WHEN o.observation_type = 'maladie' THEN 'Alerte maladie'
                    WHEN o.observation_type = 'levée' THEN 'Problème de levée'
                    ELSE 'Alerte terrain'
                END as title,
                o.description,
                CASE
                    WHEN o.severity >= 4 THEN 'high'
                    ELSE 'medium'
                END as severity,
                o.plot_id,
                plt.name_season_snapshot as plot_name,
                pr.first_name || ' ' || pr.last_name as producer_name,
                pr.id as producer_id,
                o.created_at
            FROM public.observations o
            JOIN public.plots plt ON o.plot_id = plt.id
            JOIN public.producers pr ON plt.producer_id = pr.id
            WHERE pr.id = ANY(v_producer_ids)
              AND o.severity >= 3
              AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY o.severity DESC, o.created_at DESC
            LIMIT 10
        ) subq
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_terrain_alerts(uuid) TO authenticated;

COMMENT ON FUNCTION get_agent_terrain_alerts(uuid) IS 
  'Récupère les alertes terrain pour un agent via agent_assignments. Utilise plots directement.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTION get_agent_terrain_alerts CORRIGÉE       ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ agent_producer_assignments → agent_assignments (système unifié)';
  RAISE NOTICE '  ✓ farm_file_plots → plots';
  RAISE NOTICE '  ✓ farm_files supprimée (plots.producer_id direct)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 26 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

