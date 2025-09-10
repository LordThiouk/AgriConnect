-- Migration: Création de la fonction RPC get_farm_files
-- Date: 2025-01-10
-- Description: Fonction pour récupérer les fiches d'exploitation d'un agent avec toutes les données nécessaires

CREATE OR REPLACE FUNCTION get_farm_files(
  p_agent_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  status TEXT,
  responsible_producer_id UUID,
  cooperative_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_commune TEXT,
  producer_department TEXT,
  producer_region TEXT,
  cooperative_name TEXT,
  plots_count BIGINT,
  total_area_hectares NUMERIC,
  completion_percent NUMERIC,
  soil_types TEXT[],
  water_sources TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.id,
    ff.name,
    ff.status,
    ff.responsible_producer_id,
    ff.cooperative_id,
    ff.created_at,
    ff.updated_at,
    ff.created_by,
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.phone as producer_phone,
    p.commune as producer_commune,
    p.department as producer_department,
    p.region as producer_region,
    c.name as cooperative_name,
    COALESCE(plot_stats.plots_count, 0) as plots_count,
    COALESCE(plot_stats.total_area_hectares, 0) as total_area_hectares,
    COALESCE(plot_stats.completion_percent, 0) as completion_percent,
    COALESCE(plot_stats.soil_types, ARRAY[]::TEXT[]) as soil_types,
    COALESCE(plot_stats.water_sources, ARRAY[]::TEXT[]) as water_sources
  FROM farm_files ff
  LEFT JOIN producers p ON ff.responsible_producer_id = p.id
  LEFT JOIN cooperatives c ON ff.cooperative_id = c.id
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(pl.id) as plots_count,
      COALESCE(SUM(pl.area_hectares), 0) as total_area_hectares,
      CASE 
        WHEN COUNT(pl.id) = 0 THEN 0
        ELSE ROUND(
          (COUNT(CASE WHEN pl.area_hectares IS NOT NULL 
                     AND pl.soil_type IS NOT NULL 
                     AND pl.water_source IS NOT NULL 
                     AND pl.status IS NOT NULL 
                     THEN 1 END) * 100.0) / COUNT(pl.id)
        )
      END as completion_percent,
      ARRAY_AGG(DISTINCT pl.soil_type) FILTER (WHERE pl.soil_type IS NOT NULL) as soil_types,
      ARRAY_AGG(DISTINCT pl.water_source) FILTER (WHERE pl.water_source IS NOT NULL) as water_sources
    FROM plots pl
    WHERE pl.producer_id = ff.responsible_producer_id
  ) plot_stats ON true
  WHERE ff.created_by = p_agent_id
  ORDER BY ff.updated_at DESC;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_farm_files(UUID) IS 'Récupère les fiches d''exploitation d''un agent avec toutes les statistiques calculées';

-- Grant des permissions
GRANT EXECUTE ON FUNCTION get_farm_files(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_farm_files(UUID) TO anon;
