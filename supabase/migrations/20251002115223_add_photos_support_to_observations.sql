-- Migration: Ajout du support des photos pour les observations
-- Description: Modifie le RPC get_observations_for_plot pour inclure has_photos
-- Date: 2025-01-02

-- 1. Supprimer et recréer la fonction get_observations_for_plot avec support photos
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

-- 2. Commentaire sur la fonction
COMMENT ON FUNCTION public.get_observations_for_plot(uuid) IS 'Récupère les observations d une parcelle avec indicateur de présence de photos';

-- 3. Test de la fonction
DO $$
DECLARE
  test_plot_id uuid;
  obs_count integer;
BEGIN
  -- Récupérer une parcelle de test
  SELECT plots.id INTO test_plot_id
  FROM public.plots
  LIMIT 1;

  IF test_plot_id IS NOT NULL THEN
    -- Tester la fonction
    SELECT COUNT(*) INTO obs_count
    FROM get_observations_for_plot(test_plot_id);
    
    RAISE NOTICE '✅ Test get_observations_for_plot: % observations trouvées pour parcelle %', obs_count, test_plot_id;
  ELSE
    RAISE NOTICE '⚠️ Aucune parcelle trouvée pour le test';
  END IF;
END;
$$;
