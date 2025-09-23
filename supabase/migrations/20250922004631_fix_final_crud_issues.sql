-- Migration finale pour corriger les derniers problèmes CRUD
-- Date: 2025-01-22
-- Description: Corrige update_recommendation et update_agri_rule

-- ===== SUPPRIMER TOUTES LES VERSIONS CONFLICTUELLES =====
DROP FUNCTION IF EXISTS update_recommendation(uuid, text, text, text, text, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS update_agri_rule(uuid, text, text, text, text, text, text, jsonb, text[], text[], boolean) CASCADE;
DROP FUNCTION IF EXISTS update_agri_rule(uuid, text, text, text, text, text, text, text[], text[], boolean) CASCADE;

-- ===== 1. CORRIGER update_recommendation AVEC ALIAS =====
CREATE OR REPLACE FUNCTION update_recommendation(
  p_id uuid,
  p_title text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_recommendation_type text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_plot_id uuid DEFAULT NULL,
  p_rule_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  recommendation_type text,
  priority text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  plot_id uuid,
  rule_code text,
  plot_name text,
  plot_area_hectares numeric,
  producer_name text,
  cooperative_name text,
  rule_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rec_id uuid;
BEGIN
  -- Vérifier que la recommandation existe
  IF NOT EXISTS (SELECT 1 FROM recommendations WHERE recommendations.id = p_id) THEN
    RAISE EXCEPTION 'Recommandation non trouvée';
  END IF;

  -- Mettre à jour la recommandation avec alias pour éviter l'ambiguïté
  UPDATE recommendations
  SET
    title = COALESCE(p_title, recommendations.title),
    message = COALESCE(p_message, recommendations.message),
    recommendation_type = COALESCE(p_recommendation_type, recommendations.recommendation_type),
    priority = COALESCE(p_priority, recommendations.priority),
    status = COALESCE(p_status, recommendations.status),
    plot_id = COALESCE(p_plot_id, recommendations.plot_id),
    rule_code = COALESCE(p_rule_code, recommendations.rule_code),
    updated_at = NOW()
  WHERE recommendations.id = p_id
  RETURNING recommendations.id INTO updated_rec_id;

  -- Retourner la recommandation mise à jour avec les détails
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.message,
    r.recommendation_type,
    r.priority,
    r.status,
    r.created_at,
    r.updated_at,
    r.plot_id,
    r.rule_code,
    pl.name as plot_name,
    ffp.area_hectares as plot_area_hectares,
    p.display_name as producer_name,
    c.name as cooperative_name,
    ar.name as rule_name
  FROM recommendations r
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN farm_file_plots ffp ON pl.id = ffp.plot_id
  LEFT JOIN producers pr ON ffp.producer_id = pr.id
  LEFT JOIN profiles p ON pr.profile_id = p.id
  LEFT JOIN cooperatives c ON pr.cooperative_id = c.id
  LEFT JOIN agri_rules ar ON r.rule_code = ar.code
  WHERE r.id = updated_rec_id;
END;
$$;

-- ===== 2. CRÉER update_agri_rule UNIQUE =====
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
