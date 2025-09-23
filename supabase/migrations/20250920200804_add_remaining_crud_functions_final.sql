-- Migration pour ajouter les fonctions CRUD restantes
-- Date: 2025-01-20
-- Description: Ajoute les fonctions manquantes pour le CRUD complet

-- Supprimer toutes les fonctions existantes qui pourraient causer des conflits
DROP FUNCTION IF EXISTS update_recommendation CASCADE;
DROP FUNCTION IF EXISTS create_agri_rule CASCADE;
DROP FUNCTION IF EXISTS update_agri_rule CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS resend_notification CASCADE;

-- ===== RECOMMENDATIONS CRUD =====

-- Update Recommendation
CREATE OR REPLACE FUNCTION update_recommendation(
  p_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_recommendation_type text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_status text DEFAULT NULL,
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
  updated_at timestamptz,
  plot_area_hectares numeric,
  plot_name text,
  producer_name text,
  cooperative_name text,
  rule_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_recommendation_id uuid;
BEGIN
  -- Vérifier que la recommandation existe
  IF NOT EXISTS (SELECT 1 FROM recommendations WHERE id = p_id) THEN
    RAISE EXCEPTION 'Recommandation non trouvée';
  END IF;

  -- Validation des paramètres si fournis
  IF p_recommendation_type IS NOT NULL AND p_recommendation_type NOT IN ('fertilisation', 'irrigation', 'pest_control', 'harvest', 'other') THEN
    RAISE EXCEPTION 'Type de recommandation invalide';
  END IF;
  
  IF p_priority IS NOT NULL AND p_priority NOT IN ('urgent', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'Priorité invalide';
  END IF;
  
  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'sent', 'acknowledged', 'completed', 'dismissed') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;

  -- Mettre à jour la recommandation
  UPDATE recommendations 
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    recommendation_type = COALESCE(p_recommendation_type, recommendation_type),
    priority = COALESCE(p_priority, priority),
    status = COALESCE(p_status, status),
    plot_id = COALESCE(p_plot_id, plot_id),
    rule_code = COALESCE(p_rule_code, rule_code),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING id INTO updated_recommendation_id;

  -- Retourner les détails complets
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.recommendation_type,
    r.priority,
    r.status,
    r.updated_at,
    COALESCE(pl.area_hectares, 0) as plot_area_hectares,
    COALESCE(pl.name, 'Parcelle inconnue') as plot_name,
    COALESCE(pr.display_name, 'Producteur inconnu') as producer_name,
    COALESCE(c.name, 'Coopérative inconnue') as cooperative_name,
    COALESCE(ar.name, 'Règle inconnue') as rule_name
  FROM recommendations r
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN profiles pr ON pl.producer_id = pr.id
  LEFT JOIN cooperatives c ON pl.cooperative_id = c.id
  LEFT JOIN agri_rules ar ON r.rule_code = ar.code
  WHERE r.id = updated_recommendation_id;
END;
$$;

-- ===== AGRI RULES CRUD =====

-- Create Agri Rule
CREATE OR REPLACE FUNCTION create_agri_rule(
  p_name text,
  p_description text,
  p_code text,
  p_severity text DEFAULT 'info',
  p_action_type text DEFAULT 'notification',
  p_condition_logic text DEFAULT NULL,
  p_action_params jsonb DEFAULT NULL,
  p_applicable_crops text[] DEFAULT NULL,
  p_applicable_regions text[] DEFAULT NULL,
  p_is_active boolean DEFAULT true,
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
  applicable_crops text[],
  applicable_regions text[],
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_rule_id uuid;
BEGIN
  -- Validation des paramètres
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Le nom est requis';
  END IF;
  
  IF p_code IS NULL OR p_code = '' THEN
    RAISE EXCEPTION 'Le code est requis';
  END IF;
  
  -- Vérifier que le code est unique
  IF EXISTS (SELECT 1 FROM agri_rules WHERE code = p_code) THEN
    RAISE EXCEPTION 'Ce code de règle existe déjà';
  END IF;
  
  -- Validation de la sévérité
  IF p_severity NOT IN ('critical', 'warning', 'info', 'success') THEN
    RAISE EXCEPTION 'Sévérité invalide';
  END IF;
  
  -- Validation du type d'action
  IF p_action_type NOT IN ('notification', 'alert', 'recommendation', 'automatic') THEN
    RAISE EXCEPTION 'Type d''action invalide';
  END IF;

  -- Créer la règle
  INSERT INTO agri_rules (
    name, description, code, severity, action_type, condition_logic,
    action_params, applicable_crops, applicable_regions, is_active, created_by, created_at
  ) VALUES (
    p_name, p_description, p_code, p_severity, p_action_type, p_condition_logic,
    p_action_params, p_applicable_crops, p_applicable_regions, p_is_active, p_created_by, NOW()
  ) RETURNING id INTO new_rule_id;

  -- Retourner la règle créée
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
    ar.applicable_crops,
    ar.applicable_regions,
    ar.is_active,
    ar.created_at
  FROM agri_rules ar
  WHERE ar.id = new_rule_id;
END;
$$;

-- Update Agri Rule
CREATE OR REPLACE FUNCTION update_agri_rule(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_severity text DEFAULT NULL,
  p_action_type text DEFAULT NULL,
  p_condition_logic text DEFAULT NULL,
  p_action_params jsonb DEFAULT NULL,
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
  condition_logic text,
  action_params jsonb,
  applicable_crops text[],
  applicable_regions text[],
  is_active boolean,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rule_id uuid;
BEGIN
  -- Vérifier que la règle existe
  IF NOT EXISTS (SELECT 1 FROM agri_rules WHERE id = p_id) THEN
    RAISE EXCEPTION 'Règle métier non trouvée';
  END IF;

  -- Validation des paramètres si fournis
  IF p_severity IS NOT NULL AND p_severity NOT IN ('critical', 'warning', 'info', 'success') THEN
    RAISE EXCEPTION 'Sévérité invalide';
  END IF;
  
  IF p_action_type IS NOT NULL AND p_action_type NOT IN ('notification', 'alert', 'recommendation', 'automatic') THEN
    RAISE EXCEPTION 'Type d''action invalide';
  END IF;

  -- Mettre à jour la règle
  UPDATE agri_rules 
  SET 
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    severity = COALESCE(p_severity, severity),
    action_type = COALESCE(p_action_type, action_type),
    condition_logic = COALESCE(p_condition_logic, condition_logic),
    action_params = COALESCE(p_action_params, action_params),
    applicable_crops = COALESCE(p_applicable_crops, applicable_crops),
    applicable_regions = COALESCE(p_applicable_regions, applicable_regions),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING id INTO updated_rule_id;

  -- Retourner la règle mise à jour
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
    ar.applicable_crops,
    ar.applicable_regions,
    ar.is_active,
    ar.updated_at
  FROM agri_rules ar
  WHERE ar.id = updated_rule_id;
END;
$$;

-- ===== NOTIFICATIONS CRUD =====

-- Supprimer l'ancienne fonction resend_notification si elle existe
DROP FUNCTION IF EXISTS resend_notification(uuid);

-- Create Notification
CREATE OR REPLACE FUNCTION create_notification(
  p_title text,
  p_message text,
  p_channel text DEFAULT 'sms',
  p_recipient_id uuid DEFAULT NULL,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_sent_by uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
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
  -- Validation des paramètres
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Le titre est requis';
  END IF;
  
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'Le message est requis';
  END IF;
  
  -- Validation du canal
  IF p_channel NOT IN ('sms', 'email', 'push', 'whatsapp') THEN
    RAISE EXCEPTION 'Canal de notification invalide';
  END IF;

  -- Créer la notification
  INSERT INTO notifications (
    title, message, channel, recipient_id, related_entity_type,
    related_entity_id, sent_by, status, sent_at, created_at
  ) VALUES (
    p_title, p_message, p_channel, p_recipient_id, p_related_entity_type,
    p_related_entity_id, p_sent_by, 'pending', NOW(), NOW()
  ) RETURNING id INTO new_notification_id;

  -- Retourner la notification créée
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
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

-- Resend Notification
CREATE OR REPLACE FUNCTION resend_notification(
  p_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
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
    n.message,
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

COMMENT ON FUNCTION update_recommendation IS 'Met à jour une recommandation existante';
COMMENT ON FUNCTION create_agri_rule IS 'Crée une nouvelle règle métier agricole';
COMMENT ON FUNCTION update_agri_rule IS 'Met à jour une règle métier existante';
COMMENT ON FUNCTION create_notification IS 'Crée une nouvelle notification';
COMMENT ON FUNCTION resend_notification IS 'Renvoie une notification existante';
