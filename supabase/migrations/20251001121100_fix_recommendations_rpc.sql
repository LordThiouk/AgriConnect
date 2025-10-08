-- ============================================================================
-- FIX: Mise à jour get_recommendations_with_details pour utiliser plots
-- ============================================================================
-- Problème: La fonction utilise farm_file_plots pour area_hectares, soil_type, water_source
-- Solution: plots contient déjà ces colonnes, utiliser directement plots
-- ============================================================================

DROP FUNCTION IF EXISTS get_recommendations_with_details(JSONB, INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_recommendations_with_details(
  filters JSONB DEFAULT '{}'::jsonb,
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  crop_id UUID,
  plot_id UUID,
  producer_id UUID,
  rule_code TEXT,
  title TEXT,
  message TEXT,
  recommendation_type TEXT,
  priority TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_region TEXT,
  producer_cooperative_id UUID,
  producer_cooperative_name TEXT,
  plot_name TEXT,
  plot_area_hectares NUMERIC,
  plot_soil_type TEXT,
  plot_water_source TEXT,
  plot_status TEXT,
  crop_crop_type TEXT,
  crop_variety TEXT,
  crop_sowing_date DATE,
  crop_status TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  total_count_val BIGINT;
BEGIN
  -- Calculate offset
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots plt ON r.plot_id = plt.id
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id');

  -- Return paginated results
  RETURN QUERY
  SELECT 
    r.id,
    r.crop_id,
    r.plot_id,
    r.producer_id,
    r.rule_code,
    r.title,
    r.message,
    r.recommendation_type,
    r.priority,
    r.status,
    r.sent_at,
    r.acknowledged_at,
    r.completed_at,
    r.created_at,
    r.updated_at,
    -- Producer details
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.phone as producer_phone,
    p.region as producer_region,
    p.cooperative_id as producer_cooperative_id,
    co.name as producer_cooperative_name,
    -- Plot details (depuis plots directement)
    plt.name_season_snapshot as plot_name,
    plt.area_hectares as plot_area_hectares,
    plt.soil_type as plot_soil_type,
    plt.water_source as plot_water_source,
    plt.status as plot_status,
    -- Crop details
    c.crop_type as crop_crop_type,
    c.variety as crop_variety,
    c.sowing_date as crop_sowing_date,
    c.status as crop_status,
    -- Total count
    total_count_val as total_count
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots plt ON r.plot_id = plt.id
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id')
  ORDER BY r.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recommendations_with_details(JSONB, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommendations_with_details(JSONB, INTEGER, INTEGER) TO anon;

COMMENT ON FUNCTION get_recommendations_with_details(JSONB, INTEGER, INTEGER) IS 
  'Récupère les recommandations avec détails (producteur, parcelle, culture). Utilise plots directement.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTION RECOMMENDATIONS CORRIGÉE                ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonction mise à jour:';
  RAISE NOTICE '  ✓ get_recommendations_with_details';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • farm_file_plots supprimé';
  RAISE NOTICE '  • plots utilisé directement pour area_hectares, soil_type, water_source';
  RAISE NOTICE '  • pl.name → plt.name_season_snapshot';
  RAISE NOTICE '';
  RAISE NOTICE '🎊 TOUTES LES FONCTIONS RPC MIGRÉES: 25 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

