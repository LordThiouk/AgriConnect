-- ============================================================================
-- FIX: get_farm_files utilise encore agent_producer_assignments
-- ============================================================================
-- Problème: get_farm_files JOIN agent_producer_assignments (ligne 55)
-- Solution: Utiliser agent_assignments à la place
-- ============================================================================

DROP FUNCTION IF EXISTS get_farm_files(UUID);

CREATE OR REPLACE FUNCTION get_farm_files(p_agent_user_id UUID)
RETURNS TABLE (
    id UUID,
    farm_file_name TEXT,
    producer_name TEXT,
    location TEXT,
    plot_count BIGINT,
    completion_percent NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ff.id,
        ff.name as farm_file_name,
        COALESCE(
            p.first_name || ' ' || p.last_name,
            'Non assigné'
        ) as producer_name,
        COALESCE(ff.village || ', ' || ff.commune, 'N/A') as location,
        (
            -- Compter les parcelles liées via plots
            SELECT COUNT(*)
            FROM public.plots plt
            WHERE plt.farm_file_id = ff.id
        ) as plot_count,
        (
            (
                (CASE WHEN ff.name IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN ff.village IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN ff.responsible_producer_id IS NOT NULL THEN 1 ELSE 0 END)
            ) * 100 / 3
        )::numeric as completion_percent,
        ff.status
    FROM
        public.farm_files ff
        LEFT JOIN public.producers p ON ff.responsible_producer_id = p.id
        INNER JOIN public.profiles prof_agent ON prof_agent.user_id = p_agent_user_id AND prof_agent.role = 'agent'
        INNER JOIN public.agent_assignments aa ON (
            aa.assigned_to_id = ff.responsible_producer_id 
            AND aa.agent_id = prof_agent.id
            AND aa.assigned_to_type = 'producer'
        )
    WHERE
        ff.responsible_producer_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_farm_files(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_farm_files(UUID) IS 
  'Récupère les fiches d''exploitation assignées à un agent. Utilise agent_assignments et plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '      get_farm_files MIGRE VERS agent_assignments';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  - agent_producer_assignments -> agent_assignments';
  RAISE NOTICE '  - apa.producer_id -> aa.assigned_to_id';
  RAISE NOTICE '  - Ajout filtre: aa.assigned_to_type = ''producer''';
  RAISE NOTICE '';
  RAISE NOTICE 'Le mobile getFarmFiles() devrait fonctionner maintenant';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;

