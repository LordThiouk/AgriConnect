-- ============================================================================
-- CREATE: Version ultra-simplifiée de get_agent_today_visits
-- ============================================================================
-- Problème: Erreur GROUP BY persistante
-- Solution: RPC ultra-simplifié sans aucune agrégation complexe
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_agent_today_visits(uuid) CASCADE;

-- Créer une nouvelle fonction ultra-simplifiée
CREATE OR REPLACE FUNCTION get_agent_today_visits(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    producer text,
    producer_id uuid,
    location text,
    status text,
    has_gps boolean,
    plot_id uuid,
    visit_date text,
    duration_minutes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        COALESCE(v.duration_minutes, 30) as duration_minutes
    FROM public.visits v
    LEFT JOIN public.producers p ON v.producer_id = p.id
    LEFT JOIN public.plots pl ON v.plot_id = pl.id
    WHERE v.agent_id = p_user_id
    AND v.visit_date::date = CURRENT_DATE
    ORDER BY v.visit_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_agent_today_visits(uuid) TO authenticated;

COMMENT ON FUNCTION get_agent_today_visits(uuid) IS 
  'Récupère les VRAIES visites du jour pour un agent depuis la table visits. Version ultra-simplifiée.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      RPC VISITES ULTRA-SIMPLIFIÉ                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ Utilise RETURNS TABLE au lieu de JSON';
  RAISE NOTICE '  ✓ Aucune agrégation, aucune fonction JSON';
  RAISE NOTICE '  ✓ Retourne directement les visites du jour';
  RAISE NOTICE '  ✓ Jointure simple avec producers et plots';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Les IDs retournés sont maintenant de vrais IDs de visites';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
