-- Create RPC function to get farm files by producer with statistics
-- This function returns farm files for a specific producer with calculated statistics

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
        -- Calculate plot count
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
            ffp.farm_file_id,
            COUNT(*) as plot_count
        FROM farm_file_plots ffp
        GROUP BY ffp.farm_file_id
    ) plot_stats ON ff.id = plot_stats.farm_file_id
    WHERE ff.responsible_producer_id = p_producer_id
    ORDER BY ff.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_farm_files_by_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_farm_files_by_producer(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION get_farm_files_by_producer(UUID) IS 'Récupère les fiches d''exploitation d''un producteur avec statistiques calculées (parcelles, complétion)';
