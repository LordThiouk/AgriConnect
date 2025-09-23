-- Migration pour corriger le conflit avec delete_recommendation
-- Date: 2025-01-20
-- Description: Supprime l'ancienne fonction et recrée la nouvelle

-- Supprimer l'ancienne fonction qui cause le conflit
DROP FUNCTION IF EXISTS delete_recommendation(uuid);

-- Recréer la fonction delete_recommendation avec le bon paramètre
CREATE OR REPLACE FUNCTION delete_recommendation(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que la recommandation existe
  IF NOT EXISTS (SELECT 1 FROM recommendations WHERE id = p_id) THEN
    RAISE EXCEPTION 'Recommandation non trouvée';
  END IF;

  -- Supprimer la recommandation
  DELETE FROM recommendations WHERE id = p_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION delete_recommendation IS 'Supprime une recommandation par son ID';
