-- Migration pour corriger les erreurs dans les fonctions CRUD
-- Date: 2025-01-20
-- Description: Corrige les erreurs identifiées dans les tests CRUD

-- ===== SUPPRIMER LES FONCTIONS EXISTANTES =====
DROP FUNCTION IF EXISTS create_recommendation CASCADE;
DROP FUNCTION IF EXISTS create_agri_rule CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS resend_notification CASCADE;

-- ===== CORRECTION DES ERREURS =====

-- 1. Créer la fonction create_recommendation manquante
CREATE OR REPLACE FUNCTION create_recommendation(
  p_title text,
  p_description text,
  p_recommendation_type text,
  p_priority text,
  p_status text DEFAULT 'pending',
  p_plot_id uuid DEFAULT NULL,
  p_rule_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
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
    description,
    recommendation_type,
    priority,
    status,
    plot_id,
    rule_code
  ) VALUES (
    p_title,
    p_description,
    p_recommendation_type,
    p_priority,
    p_status,
    p_plot_id,
    p_rule_code
  )
  RETURNING id INTO new_rec_id;

  -- Retourner la nouvelle recommandation avec les détails
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
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

-- 2. Corriger l'ambiguïté dans create_agri_rule (column reference "code" is ambiguous)
CREATE OR REPLACE FUNCTION create_agri_rule(
  p_name text,
  p_description text,
  p_code text,
  p_severity text,
  p_action_type text,
  p_condition_logic text,
  p_action_params jsonb DEFAULT '{}',
  p_applicable_crops text[] DEFAULT '{}',
  p_applicable_regions text[] DEFAULT '{}',
  p_is_active boolean DEFAULT TRUE,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  code text,
  severity text,
  action_type text,
  condition_logic text,
  action_params jsonb,
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
    condition_logic,
    action_params,
    applicable_crops,
    applicable_regions,
    is_active,
    created_by
  ) VALUES (
    p_name,
    p_description,
    p_code,
    p_severity,
    p_action_type,
    p_condition_logic,
    p_action_params,
    p_applicable_crops,
    p_applicable_regions,
    p_is_active,
    p_created_by
  )
  RETURNING id INTO new_rule_id;

  -- Retourner la nouvelle règle avec les détails
  RETURN QUERY
  SELECT
    ar.id,
    ar.name,
    ar.description,
    ar.code,
    ar.severity,
    ar.action_type,
    ar.condition_logic,
    ar.action_params,
    CASE WHEN jsonb_typeof(ar.applicable_crops) = 'array' THEN ar.applicable_crops ELSE to_jsonb(ar.applicable_crops) END as applicable_crops,
    CASE WHEN jsonb_typeof(ar.applicable_regions) = 'array' THEN ar.applicable_regions ELSE to_jsonb(ar.applicable_regions) END as applicable_regions,
    ar.is_active,
    ar.created_at
  FROM agri_rules ar
  WHERE ar.id = new_rule_id;
END;
$$;

-- 3. Corriger create_notification (column "message" does not exist)
-- D'abord, vérifions la structure de la table notifications
-- Il semble que la colonne s'appelle "content" et non "message"

CREATE OR REPLACE FUNCTION create_notification(
  p_title text,
  p_content text,
  p_channel text DEFAULT 'sms',
  p_recipient_id uuid DEFAULT NULL,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_sent_by uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  channel text,
  status text,
  sent_at timestamptz,
  recipient_name text,
  sender_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    title,
    content,
    channel,
    recipient_id,
    related_entity_type,
    related_entity_id,
    sent_by,
    status,
    sent_at
  ) VALUES (
    p_title,
    p_content,
    p_channel,
    p_recipient_id,
    p_related_entity_type,
    p_related_entity_id,
    p_sent_by,
    'pending', -- Statut initial
    NOW()
  )
  RETURNING id INTO new_notification_id;

  -- Retourner la nouvelle notification avec les détails
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.channel,
    n.status,
    n.sent_at,
    COALESCE(pr.display_name, 'Destinataire inconnu') as recipient_name,
    COALESCE(ps.display_name, 'Expéditeur inconnu') as sender_name
  FROM notifications n
  LEFT JOIN profiles pr ON n.recipient_id = pr.id
  LEFT JOIN profiles ps ON n.sent_by = ps.id
  WHERE n.id = new_notification_id;
END;
$$;

-- 4. Corriger resend_notification pour utiliser "content" au lieu de "message"
CREATE OR REPLACE FUNCTION resend_notification(
  p_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  channel text,
  status text,
  sent_at timestamptz,
  recipient_name text,
  sender_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_notification_id uuid;
BEGIN
  -- Vérifier que la notification existe
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE id = p_id) THEN
    RAISE EXCEPTION 'Notification non trouvée';
  END IF;

  -- Mettre à jour la notification pour la renvoyer
  UPDATE notifications
  SET
    status = 'pending',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING id INTO updated_notification_id;

  -- Retourner la notification mise à jour
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.channel,
    n.status,
    n.sent_at,
    COALESCE(pr.display_name, 'Destinataire inconnu') as recipient_name,
    COALESCE(ps.display_name, 'Expéditeur inconnu') as sender_name
  FROM notifications n
  LEFT JOIN profiles pr ON n.recipient_id = pr.id
  LEFT JOIN profiles ps ON n.sent_by = ps.id
  WHERE n.id = updated_notification_id;
END;
$$;

-- ===== COMMENTS =====
-- Les commentaires seront ajoutés dans une migration séparée
