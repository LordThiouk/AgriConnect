-- ============================================================================
-- FIX: Mise à jour des fonctions RPC crops pour utiliser plots
-- ============================================================================
-- Fonctions à corriger:
--   1. get_crops_with_plot_info
--   2. get_crop_by_id_with_plot_info
--   3. get_crops_count
-- ============================================================================

-- 1. FIX: get_crops_with_plot_info
-- ============================================================================

DROP FUNCTION IF EXISTS get_crops_with_plot_info(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID, INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_crops_with_plot_info(
  plot_id_param UUID DEFAULT NULL,
  search_param TEXT DEFAULT NULL,
  crop_type_param TEXT DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  season_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL,
  page_param INTEGER DEFAULT 1,
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  crop_type TEXT,
  variety TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  expected_yield_kg NUMERIC,
  actual_yield_kg NUMERIC,
  area_hectares NUMERIC,
  status TEXT,
  notes TEXT,
  season_id UUID,
  plot_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plot_name TEXT,
  plot_producer_id UUID,
  operations_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  offset_val := (page_param - 1) * limit_param;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.crop_type,
    c.variety,
    c.sowing_date,
    c.expected_harvest_date,
    c.actual_harvest_date,
    c.expected_yield_kg,
    c.actual_yield_kg,
    c.area_hectares,
    c.status,
    c.notes,
    c.season_id,
    c.plot_id,
    c.created_at,
    c.updated_at,
    plt.name_season_snapshot as plot_name,
    plt.producer_id as plot_producer_id,
    COUNT(o.id) as operations_count
  FROM crops c
  LEFT JOIN plots plt ON c.plot_id = plt.id
  LEFT JOIN operations o ON c.id = o.crop_id
  LEFT JOIN seasons s ON c.season_id = s.id
  LEFT JOIN profiles p ON plt.producer_id = p.id
  WHERE 
    (plot_id_param IS NULL OR c.plot_id = plot_id_param)
    AND (search_param IS NULL OR 
         c.crop_type ILIKE '%' || search_param || '%' OR 
         c.variety ILIKE '%' || search_param || '%' OR 
         c.notes ILIKE '%' || search_param || '%')
    AND (crop_type_param IS NULL OR c.crop_type = crop_type_param)
    AND (status_param IS NULL OR c.status = status_param)
    AND (season_param IS NULL OR s.label = season_param)
    AND (producer_id_param IS NULL OR plt.producer_id = producer_id_param)
    AND (region_param IS NULL OR p.region = region_param)
    AND (cooperative_id_param IS NULL OR plt.cooperative_id = cooperative_id_param)
  GROUP BY c.id, plt.name_season_snapshot, plt.producer_id
  ORDER BY c.sowing_date DESC
  LIMIT limit_param OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION get_crops_with_plot_info(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_crops_with_plot_info(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID, INTEGER, INTEGER) TO anon;

-- 2. FIX: get_crop_by_id_with_plot_info
-- ============================================================================

DROP FUNCTION IF EXISTS get_crop_by_id_with_plot_info(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_crop_by_id_with_plot_info(crop_id_param UUID)
RETURNS TABLE (
  id UUID,
  crop_type TEXT,
  variety TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  expected_yield_kg NUMERIC,
  actual_yield_kg NUMERIC,
  area_hectares NUMERIC,
  status TEXT,
  notes TEXT,
  season_id UUID,
  plot_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plot_name TEXT,
  plot_producer_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.crop_type,
    c.variety,
    c.sowing_date,
    c.expected_harvest_date,
    c.actual_harvest_date,
    c.expected_yield_kg,
    c.actual_yield_kg,
    c.area_hectares,
    c.status,
    c.notes,
    c.season_id,
    c.plot_id,
    c.created_at,
    c.updated_at,
    plt.name_season_snapshot as plot_name,
    plt.producer_id as plot_producer_id
  FROM crops c
  LEFT JOIN plots plt ON c.plot_id = plt.id
  WHERE c.id = crop_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION get_crop_by_id_with_plot_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_crop_by_id_with_plot_info(UUID) TO anon;

-- 3. FIX: get_crops_count
-- ============================================================================

DROP FUNCTION IF EXISTS get_crops_count(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_crops_count(
  plot_id_param UUID DEFAULT NULL,
  search_param TEXT DEFAULT NULL,
  crop_type_param TEXT DEFAULT NULL,
  status_param TEXT DEFAULT NULL,
  season_param TEXT DEFAULT NULL,
  producer_id_param UUID DEFAULT NULL,
  region_param TEXT DEFAULT NULL,
  cooperative_id_param UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM crops c
  LEFT JOIN plots plt ON c.plot_id = plt.id
  LEFT JOIN seasons s ON c.season_id = s.id
  LEFT JOIN profiles p ON plt.producer_id = p.id
  WHERE 
    (plot_id_param IS NULL OR c.plot_id = plot_id_param)
    AND (search_param IS NULL OR 
         c.crop_type ILIKE '%' || search_param || '%' OR 
         c.variety ILIKE '%' || search_param || '%' OR 
         c.notes ILIKE '%' || search_param || '%')
    AND (crop_type_param IS NULL OR c.crop_type = crop_type_param)
    AND (status_param IS NULL OR c.status = status_param)
    AND (season_param IS NULL OR s.label = season_param)
    AND (producer_id_param IS NULL OR plt.producer_id = producer_id_param)
    AND (region_param IS NULL OR p.region = region_param)
    AND (cooperative_id_param IS NULL OR plt.cooperative_id = cooperative_id_param);
    
  RETURN count_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_crops_count(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_crops_count(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, UUID) TO anon;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTIONS CROPS RPC CORRIGÉES                    ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ get_crops_with_plot_info';
  RAISE NOTICE '  ✓ get_crop_by_id_with_plot_info';
  RAISE NOTICE '  ✓ get_crops_count';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • farm_file_plots ffp → plots plt';
  RAISE NOTICE '  • c.farm_file_plot_id → c.plot_id';
  RAISE NOTICE '  • ffp.producer_id → plt.producer_id';
  RAISE NOTICE '  • ffp.cooperative_id → plt.cooperative_id';
  RAISE NOTICE '';
  RAISE NOTICE '🎊 TOUTES LES FONCTIONS RPC MIGRÉES: 24 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

