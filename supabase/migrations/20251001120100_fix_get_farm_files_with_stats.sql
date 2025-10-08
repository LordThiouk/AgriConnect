-- ============================================================================
-- FIX: Mise à jour get_farm_files_with_stats pour utiliser plots
-- ============================================================================
-- Problème: La fonction utilise encore farm_file_plots qui n'existe plus
-- Solution: Remplacer farm_file_plots par plots
-- ============================================================================

DROP FUNCTION IF EXISTS get_farm_files_with_stats(TEXT, TEXT, TEXT, UUID, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_farm_files_with_stats(
    p_search TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_responsible_producer_id UUID DEFAULT NULL,
    p_cooperative_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
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
        -- Calculate plot count depuis plots (nouvelle table)
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
    WHERE 
        -- Apply filters
        (p_search IS NULL OR 
         ff.name ILIKE '%' || p_search || '%' OR 
         ff.village ILIKE '%' || p_search || '%' OR 
         ff.sector ILIKE '%' || p_search || '%') AND
        (p_region IS NULL OR ff.region = p_region) AND
        (p_status IS NULL OR ff.status = p_status) AND
        (p_responsible_producer_id IS NULL OR ff.responsible_producer_id = p_responsible_producer_id) AND
        (p_cooperative_id IS NULL OR ff.cooperative_id = p_cooperative_id)
    ORDER BY ff.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_farm_files_with_stats(TEXT, TEXT, TEXT, UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_farm_files_with_stats(TEXT, TEXT, TEXT, UUID, UUID, INTEGER, INTEGER) TO anon;

-- Add comment
COMMENT ON FUNCTION get_farm_files_with_stats(TEXT, TEXT, TEXT, UUID, UUID, INTEGER, INTEGER) IS 
  'Récupère les fiches d''exploitation avec statistiques et filtres avancés. Utilise la table plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTION get_farm_files_with_stats CORRIGÉE     ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements appliqués:';
  RAISE NOTICE '  ✓ farm_file_plots → plots';
  RAISE NOTICE '  ✓ ffp.farm_file_id → plt.farm_file_id';
  RAISE NOTICE '  ✓ Calcul plot_count depuis nouvelle table plots';
  RAISE NOTICE '';
  RAISE NOTICE 'L''erreur 42P01 devrait être résolue ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

