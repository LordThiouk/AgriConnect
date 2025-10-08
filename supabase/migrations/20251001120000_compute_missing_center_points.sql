-- ============================================================================
-- CALCUL AUTOMATIQUE DES center_point MANQUANTS
-- ============================================================================
-- Problème: Toutes les parcelles ont center_point = NULL
-- Solution: Calculer le centroïde depuis geom (ST_Centroid)
-- ============================================================================

-- 1. Calculer center_point pour toutes les parcelles où il est NULL
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Calcul des center_point manquants...';
  RAISE NOTICE '';

  -- Mettre à jour les center_point NULL avec le centroïde du geom
  UPDATE public.plots
  SET center_point = ST_Centroid(geom)
  WHERE center_point IS NULL 
    AND geom IS NOT NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE '✅ % parcelles mises à jour', updated_count;
  RAISE NOTICE '';
END $$;

-- 2. Créer un trigger pour calculer automatiquement center_point lors de l'insertion/update
CREATE OR REPLACE FUNCTION public.update_center_point_from_geom()
RETURNS TRIGGER AS $$
BEGIN
  -- Si geom change et n'est pas NULL, recalculer center_point
  IF NEW.geom IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.geom IS DISTINCT FROM NEW.geom) THEN
    NEW.center_point := ST_Centroid(NEW.geom);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_center_point ON public.plots;

-- Créer le trigger
CREATE TRIGGER trigger_update_center_point
  BEFORE INSERT OR UPDATE OF geom ON public.plots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_center_point_from_geom();

COMMENT ON FUNCTION public.update_center_point_from_geom IS 
  'Calcule automatiquement le centre d''une parcelle (centroïde) depuis sa géométrie';

-- 3. Améliorer la fonction RPC pour calculer dynamiquement si center_point est NULL
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
  latitude double precision,
  longitude double precision,
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
    -- Latitude et longitude: calculer depuis center_point OU depuis geom si NULL
    COALESCE(
      ST_Y(p.center_point),
      ST_Y(ST_Centroid(p.geom))
    )::double precision AS latitude,
    COALESCE(
      ST_X(p.center_point),
      ST_X(ST_Centroid(p.geom))
    )::double precision AS longitude,
    -- geom: Conversion GEOMETRY → JSONB
    CASE 
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(p.geom)::jsonb
      ELSE NULL
    END AS geom,
    -- center_point: Conversion GEOMETRY → JSONB (ou calcul dynamique)
    CASE 
      WHEN p.center_point IS NOT NULL THEN ST_AsGeoJSON(p.center_point)::jsonb
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(ST_Centroid(p.geom))::jsonb
      ELSE NULL
    END AS center_point,
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
  'Récupère les parcelles avec géolocalisation. Calcule automatiquement lat/lon depuis center_point ou geom.';

-- 4. Mettre à jour get_agent_plots_with_geolocation également
DROP FUNCTION IF EXISTS public.get_agent_plots_with_geolocation(uuid);

CREATE OR REPLACE FUNCTION public.get_agent_plots_with_geolocation(
  agent_id_param uuid
)
RETURNS TABLE (
  id uuid,
  producer_id uuid,
  name text,
  area_hectares numeric,
  soil_type text,
  water_source text,
  status text,
  created_at timestamptz,
  latitude double precision,
  longitude double precision,
  geom jsonb,
  center_point jsonb,
  producer_first_name text,
  producer_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.producer_id,
    p.name_season_snapshot AS name,
    p.area_hectares,
    p.soil_type,
    p.water_source,
    p.status,
    p.created_at,
    -- Latitude/longitude avec fallback
    COALESCE(
      ST_Y(p.center_point),
      ST_Y(ST_Centroid(p.geom))
    )::double precision AS latitude,
    COALESCE(
      ST_X(p.center_point),
      ST_X(ST_Centroid(p.geom))
    )::double precision AS longitude,
    -- geom
    CASE 
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(p.geom)::jsonb
      ELSE NULL
    END AS geom,
    -- center_point avec fallback
    CASE 
      WHEN p.center_point IS NOT NULL THEN ST_AsGeoJSON(p.center_point)::jsonb
      WHEN p.geom IS NOT NULL THEN ST_AsGeoJSON(ST_Centroid(p.geom))::jsonb
      ELSE NULL
    END AS center_point,
    pr.first_name AS producer_first_name,
    pr.last_name AS producer_last_name
  FROM public.plots p
  LEFT JOIN public.producers pr ON pr.id = p.producer_id
  WHERE pr.agent_id = agent_id_param
  ORDER BY p.created_at DESC;
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
  RAISE NOTICE '║      CALCUL CENTER_POINT TERMINÉ                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Actions effectuées:';
  RAISE NOTICE '  ✓ center_point calculés pour parcelles existantes';
  RAISE NOTICE '  ✓ Trigger automatique créé pour nouvelles parcelles';
  RAISE NOTICE '  ✓ RPC avec fallback: center_point OU ST_Centroid(geom)';
  RAISE NOTICE '';
  RAISE NOTICE 'Les coordonnées devraient maintenant être correctes ✓';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

