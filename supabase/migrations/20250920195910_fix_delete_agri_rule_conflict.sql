-- Migration pour corriger le conflit avec delete_agri_rule
-- Date: 2025-01-20
-- Description: Supprime l'ancienne fonction et recrée la nouvelle

-- Supprimer l'ancienne fonction qui cause le conflit
DROP FUNCTION IF EXISTS delete_agri_rule(uuid);

-- Recréer la fonction delete_agri_rule avec le bon paramètre
CREATE OR REPLACE FUNCTION delete_agri_rule(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que la règle existe
  IF NOT EXISTS (SELECT 1 FROM agri_rules WHERE id = p_id) THEN
    RAISE EXCEPTION 'Règle métier non trouvée';
  END IF;

  -- Vérifier qu'aucune recommandation n'utilise cette règle
  IF EXISTS (SELECT 1 FROM recommendations WHERE rule_code = (SELECT code FROM agri_rules WHERE id = p_id)) THEN
    RAISE EXCEPTION 'Impossible de supprimer : cette règle est utilisée par des recommandations';
  END IF;

  -- Supprimer la règle
  DELETE FROM agri_rules WHERE id = p_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION delete_agri_rule IS 'Supprime une règle métier par son ID (si non utilisée)';
