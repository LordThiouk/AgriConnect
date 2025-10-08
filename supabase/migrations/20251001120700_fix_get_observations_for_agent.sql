-- ============================================================================
-- FIX: Mise à jour get_observations_for_agent pour utiliser plots
-- ============================================================================
-- Problème: La fonction utilise encore farm_file_plots
-- Solution: Utiliser directement la table plots
-- ============================================================================

DROP FUNCTION IF EXISTS get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_observations_for_agent(
  p_agent_id UUID,
  p_limit_count INTEGER DEFAULT 50,
  p_offset_count INTEGER DEFAULT 0,
  p_observation_type_filter TEXT DEFAULT NULL,
  p_severity_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  observation_type TEXT,
  observation_date DATE,
  description TEXT,
  emergence_percent INTEGER,
  pest_disease_name TEXT,
  severity INTEGER,
  affected_area_percent DECIMAL(5,2),
  recommendations TEXT,
  plot_id UUID,
  crop_id UUID,
  crop_type TEXT,
  crop_variety TEXT,
  producer_name TEXT,
  producer_phone TEXT,
  observed_by TEXT,
  is_critical BOOLEAN,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.observation_type,
    o.observation_date,
    o.description,
    o.emergence_percent,
    o.pest_disease_name,
    o.severity,
    o.affected_area_percent,
    o.recommendations,
    o.plot_id,
    o.crop_id,
    COALESCE(c.crop_type, 'N/A') as crop_type,
    COALESCE(c.variety, 'N/A') as crop_variety,
    COALESCE(pr.first_name || ' ' || pr.last_name, 'N/A') as producer_name,
    COALESCE(pr.phone, 'N/A') as producer_phone,
    COALESCE(prof.display_name, 'Agent') as observed_by,
    (o.severity >= 4) as is_critical,
    CASE 
      WHEN o.severity >= 4 THEN 'critical'
      ELSE 'new'
    END as status
  FROM observations o
  LEFT JOIN plots plt ON o.plot_id = plt.id
  LEFT JOIN producers pr ON plt.producer_id = pr.id
  LEFT JOIN crops c ON o.crop_id = c.id
  LEFT JOIN profiles prof ON o.observed_by = prof.id
  LEFT JOIN agent_producer_assignments apa ON pr.id = apa.producer_id
  LEFT JOIN profiles agent_prof ON apa.agent_id = agent_prof.id
  WHERE agent_prof.user_id = p_agent_id
    AND (p_observation_type_filter IS NULL OR o.observation_type = p_observation_type_filter)
    AND (p_severity_filter IS NULL OR o.severity = p_severity_filter)
  ORDER BY o.observation_date DESC, o.created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER) TO anon;

COMMENT ON FUNCTION get_observations_for_agent(UUID, INTEGER, INTEGER, TEXT, INTEGER) IS 
  'Récupère les observations pour un agent. Utilise la table plots directement.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTION get_observations_for_agent CORRIGÉE     ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ Suppression de farm_file_plots';
  RAISE NOTICE '  ✓ Utilisation directe de plots';
  RAISE NOTICE '  ✓ JOIN simplifié: plots → producers';
  RAISE NOTICE '';
  RAISE NOTICE 'Total fonctions RPC migrées: 17 ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

