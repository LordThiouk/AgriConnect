-- ============================================================================
-- MISE À JOUR DES FONCTIONS RPC: farm_file_plots → plots
-- ============================================================================
-- Date: 2025-10-01
-- Objectif: Mettre à jour toutes les fonctions RPC pour utiliser 'plots' au lieu de 'farm_file_plots'
--
-- Contexte: Après le renommage farm_file_plots → plots, les fonctions RPC
-- doivent être recréées pour utiliser le nouveau nom de table
-- ============================================================================

-- ============================================================================
-- 1. GET_PLOTS_WITH_GEOLOCATION
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_plots_with_geolocation(text, uuid, text, text, text, text, uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_plots_with_geolocation(
  search_param text DEFAULT NULL,
  producer_id_param uuid DEFAULT NULL,
  status_param text DEFAULT NULL,
  soil_type_param text DEFAULT NULL,
  water_source_param text DEFAULT NULL,
  region_param text DEFAULT NULL,
  cooperative_id_param uuid DEFAULT NULL,
  page_param integer DEFAULT 1,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  producer_id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  soil_ph numeric,
  water_source text,
  irrigation_type text,
  slope_percent integer,
  elevation_meters integer,
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  latitude numeric,
  longitude numeric,
  geom jsonb,
  center_point jsonb,
  producer_first_name text,
  producer_last_name text,
  producer_phone text,
  producer_region text,
  producer_cooperative_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.producer_id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.soil_ph,
    p.water_source,
    p.irrigation_type,
    p.slope_percent,
    p.elevation_meters,
    p.status,
    p.notes,
    p.created_at,
    p.updated_at,
    ST_Y(p.center_point::geometry) AS latitude,
    ST_X(p.center_point::geometry) AS longitude,
    p.geom,
    ST_AsGeoJSON(p.center_point::geometry)::jsonb AS center_point,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name,
    pr.phone AS producer_phone,
    pr.region AS producer_region,
    pr.cooperative_id AS producer_cooperative_id
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE
    (search_param IS NULL OR p.name_season_snapshot ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
    AND (status_param IS NULL OR p.status = status_param)
    AND (soil_type_param IS NULL OR p.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR p.water_source = water_source_param)
    AND (region_param IS NULL OR pr.region = region_param)
    AND (cooperative_id_param IS NULL OR pr.cooperative_id = cooperative_id_param)
  ORDER BY p.created_at DESC
  OFFSET (page_param - 1) * limit_param
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_plots_with_geolocation IS 
  'Récupère les parcelles avec géolocalisation depuis la table plots (mis à jour après migration)';

-- ============================================================================
-- 2. GET_PLOTS_WITH_GEOLOCATION_COUNT
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_plots_with_geolocation_count(text, uuid, text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.get_plots_with_geolocation_count(
  search_param text DEFAULT NULL,
  producer_id_param uuid DEFAULT NULL,
  status_param text DEFAULT NULL,
  soil_type_param text DEFAULT NULL,
  water_source_param text DEFAULT NULL,
  region_param text DEFAULT NULL,
  cooperative_id_param uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  result integer;
BEGIN
  SELECT COUNT(*)::integer INTO result
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE
    (search_param IS NULL OR p.name_season_snapshot ILIKE '%' || search_param || '%')
    AND (producer_id_param IS NULL OR p.producer_id = producer_id_param)
    AND (status_param IS NULL OR p.status = status_param)
    AND (soil_type_param IS NULL OR p.soil_type = soil_type_param)
    AND (water_source_param IS NULL OR p.water_source = water_source_param)
    AND (region_param IS NULL OR pr.region = region_param)
    AND (cooperative_id_param IS NULL OR pr.cooperative_id = cooperative_id_param);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GET_PLOTS_BY_PRODUCER
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_plots_by_producer(uuid);

CREATE OR REPLACE FUNCTION public.get_plots_by_producer(p_producer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  area_hectares numeric,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.status
  FROM public.plots p
  WHERE p.producer_id = p_producer_id
  ORDER BY p.name_season_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. GET_AGENT_TODAY_VISITS
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_agent_today_visits(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_today_visits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile_id uuid;
  v_result jsonb;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_profile_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', v.id,
      'producer', jsonb_build_object(
        'id', pr.id,
        'name', pr.first_name || ' ' || pr.last_name,
        'phone', pr.phone
      ),
      'location', COALESCE(p.name_season_snapshot, 'Non spécifiée'),
      'status', CASE 
        WHEN v.status = 'completed' THEN 'terminé'
        WHEN v.status = 'in_progress' THEN 'en cours'
        ELSE 'à faire'
      END,
      'hasGps', p.center_point IS NOT NULL,
      'plotId', v.plot_id,
      'scheduledTime', v.visit_date
    )
  ) INTO v_result
  FROM public.visits v
  LEFT JOIN public.producers pr ON pr.id = v.producer_id
  LEFT JOIN public.plots p ON p.id = v.plot_id
  WHERE v.agent_id = v_profile_id
    AND DATE(v.visit_date) = CURRENT_DATE
    AND v.status != 'completed'
  ORDER BY v.visit_date ASC;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GET_AGENT_PLOTS_WITH_GEOLOCATION
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_agent_plots_with_geolocation(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_plots_with_geolocation(p_agent_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  water_source text,
  status text,
  latitude numeric,
  longitude numeric,
  producer_first_name text,
  producer_last_name text
) AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = p_agent_user_id;

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.water_source,
    p.status,
    ST_Y(p.center_point::geometry) AS latitude,
    ST_X(p.center_point::geometry) AS longitude,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE p.center_point IS NOT NULL
    AND p.producer_id IN (
      SELECT producer_id 
      FROM public.agent_assignments aa
      WHERE aa.agent_id = v_profile_id
        AND aa.assigned_to_type = 'producer'
    )
  ORDER BY p.name_season_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GET_OPERATIONS_FOR_PLOT
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_operations_for_plot(uuid);

CREATE OR REPLACE FUNCTION public.get_operations_for_plot(p_plot_id uuid)
RETURNS TABLE (
  id uuid,
  operation_type text,
  operation_date date,
  description text,
  product_used text,
  author_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.operation_type,
    o.operation_date,
    o.description,
    o.product_used,
    COALESCE(pf.display_name, 'Inconnu') AS author_name
  FROM public.operations o
  LEFT JOIN public.profiles pf ON pf.id = o.performer_id
  WHERE o.plot_id = p_plot_id
     OR o.crop_id IN (SELECT c.id FROM public.crops c WHERE c.plot_id = p_plot_id)
  ORDER BY o.operation_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GET_OBSERVATIONS_FOR_PLOT
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_observations_for_plot(uuid);

CREATE OR REPLACE FUNCTION public.get_observations_for_plot(p_plot_id uuid)
RETURNS TABLE (
  id uuid,
  observation_type text,
  observation_date date,
  description text,
  severity integer,
  author_name text,
  has_photos boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.observation_type,
    o.observation_date,
    o.description,
    o.severity,
    COALESCE(pf.display_name, 'Inconnu') AS author_name,
    EXISTS(SELECT 1 FROM public.media m WHERE m.entity_type = 'observation' AND m.entity_id = o.id) as has_photos
  FROM public.observations o
  LEFT JOIN public.profiles pf ON pf.id = o.observed_by
  WHERE o.plot_id = p_plot_id
     OR o.crop_id IN (SELECT c.id FROM public.crops c WHERE c.plot_id = p_plot_id)
  ORDER BY o.observation_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      FONCTIONS RPC MISES À JOUR AVEC SUCCÈS            ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions RPC mises à jour:';
  RAISE NOTICE '  ✓ get_plots_with_geolocation';
  RAISE NOTICE '  ✓ get_plots_with_geolocation_count';
  RAISE NOTICE '  ✓ get_plots_by_producer';
  RAISE NOTICE '  ✓ get_agent_today_visits';
  RAISE NOTICE '  ✓ get_agent_plots_with_geolocation';
  RAISE NOTICE '  ✓ get_operations_for_plot';
  RAISE NOTICE '  ✓ get_observations_for_plot';
  RAISE NOTICE '';
  RAISE NOTICE 'Toutes les références à farm_file_plots';
  RAISE NOTICE 'ont été remplacées par plots ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

