-- Migration pour résoudre le dernier conflit update_agri_rule
-- Date: 2025-01-22
-- Description: Supprime toutes les versions conflictuelles et recrée une seule version

-- ===== SUPPRIMER TOUTES LES VERSIONS DE update_agri_rule =====
-- Utilisons une approche plus agressive pour nettoyer
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Trouver toutes les fonctions update_agri_rule
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'update_agri_rule'
    LOOP
        -- Supprimer chaque version trouvée
        EXECUTE 'DROP FUNCTION IF EXISTS update_agri_rule(' || func_record.args || ') CASCADE';
    END LOOP;
END $$;

-- ===== CRÉER LA SEULE VERSION DE update_agri_rule =====
CREATE OR REPLACE FUNCTION update_agri_rule(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_severity text DEFAULT NULL,
  p_action_type text DEFAULT NULL,
  p_condition_sql text DEFAULT NULL,
  p_action_message text DEFAULT NULL,
  p_applicable_crops text[] DEFAULT NULL,
  p_applicable_regions text[] DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  code text,
  severity text,
  action_type text,
  condition_sql text,
  action_message text,
  applicable_crops jsonb,
  applicable_regions jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rule_id uuid;
BEGIN
  -- Vérifier que la règle existe
  IF NOT EXISTS (SELECT 1 FROM agri_rules WHERE agri_rules.id = p_id) THEN
    RAISE EXCEPTION 'Règle métier non trouvée';
  END IF;

  -- Mettre à jour la règle avec alias pour éviter l'ambiguïté
  UPDATE agri_rules
  SET
    name = COALESCE(p_name, agri_rules.name),
    description = COALESCE(p_description, agri_rules.description),
    severity = COALESCE(p_severity, agri_rules.severity),
    action_type = COALESCE(p_action_type, agri_rules.action_type),
    condition_sql = COALESCE(p_condition_sql, agri_rules.condition_sql),
    action_message = COALESCE(p_action_message, agri_rules.action_message),
    applicable_crops = COALESCE(p_applicable_crops, agri_rules.applicable_crops),
    applicable_regions = COALESCE(p_applicable_regions, agri_rules.applicable_regions),
    is_active = COALESCE(p_is_active, agri_rules.is_active),
    updated_at = NOW()
  WHERE agri_rules.id = p_id
  RETURNING agri_rules.id INTO updated_rule_id;

  -- Retourner la règle mise à jour avec les détails
  RETURN QUERY
  SELECT
    ar.id,
    ar.name,
    ar.description,
    ar.code,
    ar.severity,
    ar.action_type,
    ar.condition_sql,
    ar.action_message,
    to_jsonb(ar.applicable_crops) as applicable_crops,
    to_jsonb(ar.applicable_regions) as applicable_regions,
    ar.is_active,
    ar.created_at,
    ar.updated_at
  FROM agri_rules ar
  WHERE ar.id = updated_rule_id;
END;
$$;
