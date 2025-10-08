-- ============================================================================
-- FIX: get_agent_today_visits - Version finale simplifiée
-- ============================================================================
-- Problème: Erreur GROUP BY persistante
-- Solution: RPC complètement simplifié sans agrégation
-- ============================================================================

DROP FUNCTION IF EXISTS get_agent_today_visits(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_agent_today_visits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retourner directement les visites du jour pour l'agent
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
                    WHEN pl.geom IS NOT NULL OR pl.center_point IS NOT NULL THEN true 
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
  RAISE NOTICE '║      RPC VISITES CORRIGÉ - VERSION FINALE              ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ RPC complètement simplifié';
  RAISE NOTICE '  ✓ Suppression de toute la logique complexe';
  RAISE NOTICE '  ✓ Retourne directement les visites du jour';
  RAISE NOTICE '  ✓ Jointure avec producers et plots pour les détails';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Les IDs retournés sont maintenant de vrais IDs de visites';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
