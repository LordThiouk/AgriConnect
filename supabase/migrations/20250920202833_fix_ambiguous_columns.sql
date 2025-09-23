-- Migration pour corriger les colonnes ambiguës
-- Date: 2025-01-20
-- Description: Corrige les références ambiguës aux colonnes id

-- ===== SUPPRIMER ET RECRÉER LES FONCTIONS AVEC ALIAS =====
DROP FUNCTION IF EXISTS create_recommendation CASCADE;
DROP FUNCTION IF EXISTS create_agri_rule CASCADE;

-- 1. create_recommendation avec alias pour éviter l'ambiguïté
CREATE OR REPLACE FUNCTION create_recommendation(
  p_title text,
  p_message text,
  p_recommendation_type text,
  p_priority text,
  p_status text DEFAULT 'pending',
  p_plot_id uuid DEFAULT NULL,
  p_rule_code text DEFAULT NULL,
  p_crop_id uuid DEFAULT NULL,
  p_producer_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  recommendation_type text,
  priority text,
  status text,
  created_at timestamptz,
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
  new_rec_id uuid;
BEGIN
  -- Vérifier que le titre n'est pas vide
  IF p_title IS NULL OR TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Le titre de la recommandation est obligatoire';
  END IF;

  -- Créer la nouvelle recommandation
  INSERT INTO recommendations (
    title,
    message,
    recommendation_type,
    priority,
    status,
    plot_id,
    rule_code,
    crop_id,
    producer_id
  ) VALUES (
    p_title,
    p_message,
    p_recommendation_type,
    p_priority,
    p_status,
    p_plot_id,
    p_rule_code,
    p_crop_id,
    p_producer_id
  )
  RETURNING recommendations.id INTO new_rec_id;

  -- Retourner la nouvelle recommandation avec les détails
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.message,
    r.recommendation_type,
    r.priority,
    r.status,
    r.created_at,
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
  WHERE r.id = new_rec_id;
END;
$$;

-- 2. create_agri_rule avec alias pour éviter l'ambiguïté
CREATE OR REPLACE FUNCTION create_agri_rule(
  p_name text,
  p_description text,
  p_code text,
  p_severity text,
  p_action_type text,
  p_condition_sql text,
  p_action_message text,
  p_applicable_crops text[] DEFAULT '{}',
  p_applicable_regions text[] DEFAULT '{}',
  p_is_active boolean DEFAULT TRUE
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
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_rule_id uuid;
BEGIN
  -- Vérifier que le code de la règle est unique
  IF EXISTS (SELECT 1 FROM agri_rules WHERE agri_rules.code = p_code) THEN
    RAISE EXCEPTION 'Un code de règle métier doit être unique';
  END IF;

  INSERT INTO agri_rules (
    name,
    description,
    code,
    severity,
    action_type,
    condition_sql,
    action_message,
    applicable_crops,
    applicable_regions,
    is_active
  ) VALUES (
    p_name,
    p_description,
    p_code,
    p_severity,
    p_action_type,
    p_condition_sql,
    p_action_message,
    p_applicable_crops,
    p_applicable_regions,
    p_is_active
  )
  RETURNING agri_rules.id INTO new_rule_id;

  -- Retourner la nouvelle règle avec les détails
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
    CASE WHEN jsonb_typeof(ar.applicable_crops) = 'array' THEN ar.applicable_crops ELSE to_jsonb(ar.applicable_crops) END as applicable_crops,
    CASE WHEN jsonb_typeof(ar.applicable_regions) = 'array' THEN ar.applicable_regions ELSE to_jsonb(ar.applicable_regions) END as applicable_regions,
    ar.is_active,
    ar.created_at
  FROM agri_rules ar
  WHERE ar.id = new_rule_id;
END;
$$;
