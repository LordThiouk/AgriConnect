-- ============================================================================
-- FIX: Mise à jour des fonctions RPC restantes utilisant farm_file_plots
-- ============================================================================
-- Fonctions à corriger:
--   1. get_farm_files (utilisée par agents)
--   2. get_farm_files_by_producer
-- ============================================================================

-- 1. FIX: get_farm_files
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_farm_files(uuid);

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
        INNER JOIN public.agent_producer_assignments apa ON (
            apa.producer_id = ff.responsible_producer_id 
            AND apa.agent_id = prof_agent.id
        )
    WHERE
        ff.responsible_producer_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_farm_files(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_farm_files(UUID) IS 
  'Récupère les fiches d''exploitation assignées à un agent. Utilise la table plots.';

-- 2. FIX: get_farm_files_by_producer
-- ============================================================================

DROP FUNCTION IF EXISTS get_farm_files_by_producer(UUID);

CREATE OR REPLACE FUNCTION get_farm_files_by_producer(p_producer_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    region TEXT,
    department TEXT,
    commune TEXT,
    village TEXT,
    sector TEXT,
    gpc TEXT,
    census_date DATE,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    cooperative_id UUID,
    responsible_producer_id UUID,
    created_by UUID,
    material_inventory JSONB,
    -- Calculated statistics
    plot_count BIGINT,
    completion_percentage NUMERIC,
    -- Related data
    cooperative_name TEXT,
    producer_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id,
        ff.name,
        ff.region,
        ff.department,
        ff.commune,
        ff.village,
        ff.sector,
        ff.gpc,
        ff.census_date,
        ff.status,
        ff.created_at,
        ff.updated_at,
        ff.cooperative_id,
        ff.responsible_producer_id,
        ff.created_by,
        ff.material_inventory,
        -- Calculate plot count depuis plots
        COALESCE(plot_stats.plot_count, 0)::BIGINT as plot_count,
        -- Calculate completion percentage
        CASE 
            WHEN ff.status = 'validated' THEN 100.0
            WHEN ff.status = 'draft' THEN 
                GREATEST(0, LEAST(100, 
                    -- Base completion on filled fields
                    (CASE WHEN ff.name IS NOT NULL AND ff.name != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.region IS NOT NULL AND ff.region != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.department IS NOT NULL AND ff.department != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.commune IS NOT NULL AND ff.commune != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.village IS NOT NULL AND ff.village != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.sector IS NOT NULL AND ff.sector != '' THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.census_date IS NOT NULL THEN 10 ELSE 0 END) +
                    (CASE WHEN ff.material_inventory IS NOT NULL AND ff.material_inventory != '{}' THEN 20 ELSE 0 END) +
                    (CASE WHEN COALESCE(plot_stats.plot_count, 0) > 0 THEN 20 ELSE 0 END)
                ))
            ELSE 0
        END as completion_percentage,
        -- Related data
        c.name as cooperative_name,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name
    FROM farm_files ff
    LEFT JOIN cooperatives c ON ff.cooperative_id = c.id
    LEFT JOIN producers p ON ff.responsible_producer_id = p.id
    LEFT JOIN (
        SELECT 
            plt.farm_file_id,
            COUNT(*) as plot_count
        FROM plots plt
        GROUP BY plt.farm_file_id
    ) plot_stats ON ff.id = plot_stats.farm_file_id
    WHERE ff.responsible_producer_id = p_producer_id
    ORDER BY ff.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_farm_files_by_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_farm_files_by_producer(UUID) TO anon;

COMMENT ON FUNCTION get_farm_files_by_producer(UUID) IS 
  'Récupère les fiches d''exploitation d''un producteur avec statistiques. Utilise la table plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      DERNIÈRES FONCTIONS RPC CORRIGÉES                ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ get_farm_files (agents)';
  RAISE NOTICE '  ✓ get_farm_files_by_producer';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • farm_file_plots → plots';
  RAISE NOTICE '  • ffp.farm_file_id → plt.farm_file_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 9 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

