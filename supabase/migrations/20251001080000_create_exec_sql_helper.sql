-- Migration: Fonction helper pour exécution SQL dynamique (analyse uniquement)
-- Cette fonction est utilisée par le script d'analyse pour récupérer les métadonnées

-- Suppression si existe
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Création de la fonction exec_sql pour l'analyse
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Note: Cette fonction est réservée aux admins pour l'analyse
  -- Elle ne doit être utilisée qu'en développement/staging
  
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION public.exec_sql(text) IS 
'Fonction helper pour exécution SQL dynamique - Usage: analyse et scripts de maintenance uniquement. Restreinte aux admins.';

-- RLS: Restreindre l'accès aux admins uniquement
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

