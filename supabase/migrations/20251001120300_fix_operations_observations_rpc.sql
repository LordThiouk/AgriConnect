-- ============================================================================
-- FIX: Mise à jour des fonctions RPC operations/observations
-- ============================================================================
-- Fonctions à corriger:
--   1. get_operations_with_details
--   2. get_observations_with_details_v3  
--   3. get_operations_with_details_v3
--   4. count_operations_for_producer (si existe)
-- ============================================================================

-- 1. FIX: get_operations_with_details
-- ============================================================================

DROP FUNCTION IF EXISTS get_operations_with_details(uuid, uuid, text, text, text, integer, integer) CASCADE;

CREATE OR REPLACE FUNCTION get_operations_with_details(
  plot_uuid uuid DEFAULT NULL,
  crop_uuid uuid DEFAULT NULL,
  operation_type_filter text DEFAULT NULL,
  date_from text DEFAULT NULL,
  date_to text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  operation_type text,
  operation_date date,
  description text,
  product_used text,
  dose_per_hectare decimal,
  total_dose decimal,
  unit text,
  cost_per_hectare decimal,
  total_cost decimal,
  performer_id uuid,
  performer_name text,
  performer_phone text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  crop_type text,
  crop_variety text,
  plot_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.operation_type,
    o.operation_date,
    o.description,
    o.product_used,
    o.dose_per_hectare,
    o.total_dose,
    o.unit,
    o.cost_per_hectare,
    o.total_cost,
    o.performer_id,
    COALESCE(p.display_name, 'Agent inconnu') as performer_name,
    COALESCE(p.phone, 'N/A') as performer_phone,
    o.notes,
    o.created_at,
    o.updated_at,
    o.crop_id,
    o.plot_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(plt.name_season_snapshot, 'Parcelle inconnue') as plot_name
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN plots plt ON o.plot_id = plt.id
  LEFT JOIN profiles p ON o.performer_id = p.id
  WHERE 
    (plot_uuid IS NULL OR o.plot_id = plot_uuid)
    AND (crop_uuid IS NULL OR o.crop_id = crop_uuid)
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter)
    AND (date_from IS NULL OR o.operation_date >= date_from::date)
    AND (date_to IS NULL OR o.operation_date <= date_to::date)
  ORDER BY o.operation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) TO anon;

COMMENT ON FUNCTION get_operations_with_details(uuid, uuid, text, text, text, integer, integer) IS 
  'Récupère les opérations avec détails des cultures, parcelles et informations agent. Utilise la table plots.';

-- 2. FIX: get_operations_with_details_v3
-- ============================================================================

DROP FUNCTION IF EXISTS get_operations_with_details_v3(uuid, integer, integer, text, text) CASCADE;

CREATE OR REPLACE FUNCTION get_operations_with_details_v3(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  operation_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  operation_type text,
  operation_date date,
  description text,
  product_used text,
  dose_per_hectare decimal,
  total_dose decimal,
  unit text,
  cost_per_hectare decimal,
  total_cost decimal,
  performer_id uuid,
  performer_name text,
  performer_phone text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  crop_type text,
  crop_variety text,
  plot_name text,
  agent_name text,
  agent_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.operation_type,
    o.operation_date,
    o.description,
    o.product_used,
    o.dose_per_hectare,
    o.total_dose,
    o.unit,
    o.cost_per_hectare,
    o.total_cost,
    o.performer_id,
    COALESCE(perf.display_name, 'Agent inconnu') as performer_name,
    COALESCE(perf.phone, 'N/A') as performer_phone,
    o.notes,
    o.created_at,
    o.updated_at,
    o.crop_id,
    o.plot_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(plt.name_season_snapshot, 'Parcelle inconnue') as plot_name,
    COALESCE(perf.display_name, 'N/A') as agent_name,
    COALESCE(perf.phone, 'N/A') as agent_phone
  FROM operations o
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN plots plt ON o.plot_id = plt.id
  LEFT JOIN profiles perf ON o.performer_id = perf.id
  LEFT JOIN producers prod ON plt.producer_id = prod.id
  WHERE 
    (producer_uuid IS NULL OR prod.id = producer_uuid)
    AND (search_term IS NULL OR 
         o.description ILIKE '%' || search_term || '%' OR
         o.product_used ILIKE '%' || search_term || '%' OR
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (operation_type_filter IS NULL OR o.operation_type = operation_type_filter)
  ORDER BY o.operation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operations_with_details_v3(uuid, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_operations_with_details_v3(uuid, integer, integer, text, text) TO anon;

COMMENT ON FUNCTION get_operations_with_details_v3(uuid, integer, integer, text, text) IS 
  'Récupère les opérations d''un producteur avec détails. Utilise la table plots.';

-- 3. FIX: get_observations_with_details_v3
-- ============================================================================

DROP FUNCTION IF EXISTS get_observations_with_details_v3(uuid, integer, integer, text, text) CASCADE;

CREATE OR REPLACE FUNCTION get_observations_with_details_v3(
  producer_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL,
  observation_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  observation_date date,
  observation_type text,
  growth_stage text,
  health_status text,
  pest_disease_detected boolean,
  pest_disease_description text,
  severity_level text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  crop_id uuid,
  plot_id uuid,
  observer_id uuid,
  crop_type text,
  crop_variety text,
  plot_name text,
  observer_name text,
  observer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obs.id,
    obs.observation_date,
    obs.observation_type,
    obs.growth_stage,
    obs.health_status,
    obs.pest_disease_detected,
    obs.pest_disease_description,
    obs.severity_level,
    obs.notes,
    obs.created_at,
    obs.updated_at,
    obs.crop_id,
    obs.plot_id,
    obs.observer_id,
    c.crop_type,
    c.variety as crop_variety,
    COALESCE(plt.name_season_snapshot, 'Parcelle inconnue') as plot_name,
    COALESCE(obsv.display_name, 'Agent inconnu') as observer_name,
    COALESCE(obsv.phone, 'N/A') as observer_phone
  FROM observations obs
  LEFT JOIN crops c ON obs.crop_id = c.id
  LEFT JOIN plots plt ON obs.plot_id = plt.id
  LEFT JOIN profiles obsv ON obs.observer_id = obsv.id
  LEFT JOIN producers prod ON plt.producer_id = prod.id
  WHERE 
    (producer_uuid IS NULL OR prod.id = producer_uuid)
    AND (search_term IS NULL OR 
         obs.notes ILIKE '%' || search_term || '%' OR
         obs.pest_disease_description ILIKE '%' || search_term || '%' OR
         plt.name_season_snapshot ILIKE '%' || search_term || '%')
    AND (observation_type_filter IS NULL OR obs.observation_type = observation_type_filter)
  ORDER BY obs.observation_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) TO anon;

COMMENT ON FUNCTION get_observations_with_details_v3(uuid, integer, integer, text, text) IS 
  'Récupère les observations d''un producteur avec détails. Utilise la table plots.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTIONS OPERATIONS/OBSERVATIONS CORRIGÉES      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour:';
  RAISE NOTICE '  ✓ get_operations_with_details';
  RAISE NOTICE '  ✓ get_operations_with_details_v3';
  RAISE NOTICE '  ✓ get_observations_with_details_v3';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  • farm_file_plots ffp → plots plt';
  RAISE NOTICE '  • ffp.name_season_snapshot → plt.name_season_snapshot';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 13 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

