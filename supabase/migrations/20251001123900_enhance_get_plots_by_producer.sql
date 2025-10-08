-- ============================================================================
-- ENHANCE: Améliorer get_plots_by_producer avec toutes les données nécessaires
-- ============================================================================
-- Description: Ajouter soil_type, water_source et producer_name au RPC
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_plots_by_producer(uuid);

CREATE OR REPLACE FUNCTION public.get_plots_by_producer(p_producer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  water_source text,
  status text,
  producer_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.water_source,
    p.status,
    CONCAT(pr.first_name, ' ', pr.last_name) AS producer_name
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE p.producer_id = p_producer_id
  ORDER BY p.name_season_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_plots_by_producer(uuid) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.get_plots_by_producer(uuid) IS 'Recupere les parcelles d un producteur avec toutes les donnees necessaires (superficie, type de sol, source d eau)';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      GET_PLOTS_BY_PRODUCER AMÉLIORÉ                   ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles données incluses:';
  RAISE NOTICE '  ✓ soil_type (type de sol)';
  RAISE NOTICE '  ✓ water_source (source d eau)';
  RAISE NOTICE '  ✓ producer_name (nom du producteur)';
  RAISE NOTICE '  ✓ area_hectares (superficie)';
  RAISE NOTICE '  ✓ status (statut de la parcelle)';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Dropdown parcelles avec toutes les données';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
