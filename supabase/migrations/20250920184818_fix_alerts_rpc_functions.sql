-- Fix alerts RPC functions

-- Fix get_agri_rules_with_filters - column reference "name" is ambiguous
DROP FUNCTION IF EXISTS get_agri_rules_with_filters(jsonb, integer, integer);

CREATE OR REPLACE FUNCTION get_agri_rules_with_filters(
  filters jsonb DEFAULT '{}',
  page integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  code text,
  name text,
  description text,
  condition_sql text,
  action_type text,
  action_message text,
  severity text,
  is_active boolean,
  applicable_crops jsonb,
  applicable_regions jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  total_count integer;
BEGIN
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM agri_rules ar
  WHERE (filters->>'is_active' IS NULL OR ar.is_active = (filters->>'is_active')::boolean)
    AND (filters->>'severity' IS NULL OR ar.severity = filters->>'severity')
    AND (filters->>'action_type' IS NULL OR ar.action_type = filters->>'action_type');
  
  RETURN QUERY
  SELECT 
    ar.id,
    ar.code,
    ar.name,
    ar.description,
    ar.condition_sql,
    ar.action_type,
    ar.action_message,
    ar.severity,
    ar.is_active,
    ar.applicable_crops,
    ar.applicable_regions,
    ar.created_at,
    ar.updated_at,
    total_count::bigint
  FROM agri_rules ar
  WHERE (filters->>'is_active' IS NULL OR ar.is_active = (filters->>'is_active')::boolean)
    AND (filters->>'severity' IS NULL OR ar.severity = filters->>'severity')
    AND (filters->>'action_type' IS NULL OR ar.action_type = filters->>'action_type')
  ORDER BY ar.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

-- Fix get_notifications_with_details - column p.first_name does not exist
DROP FUNCTION IF EXISTS get_notifications_with_details(jsonb, integer, integer);

CREATE OR REPLACE FUNCTION get_notifications_with_details(
  filters jsonb DEFAULT '{}',
  page integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  title text,
  body text,
  channel text,
  provider text,
  status text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  message text,
  type text,
  is_read boolean,
  total_count bigint,
  -- Profile details
  profile_full_name text,
  profile_phone text,
  profile_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  total_count integer;
BEGIN
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE (filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'provider' IS NULL OR n.provider = filters->>'provider')
    AND (filters->>'profile_id' IS NULL OR n.profile_id = (filters->>'profile_id')::uuid);
  
  RETURN QUERY
  SELECT 
    n.id,
    n.profile_id,
    n.title,
    n.body,
    n.channel,
    n.provider,
    n.status,
    n.sent_at,
    n.delivered_at,
    n.created_at,
    n.updated_at,
    n.user_id,
    n.message,
    n.type,
    n.is_read,
    total_count::bigint,
    -- Profile details
    COALESCE(p.full_name, 'Utilisateur inconnu') as profile_full_name,
    p.phone as profile_phone,
    p.role as profile_role
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE (filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'provider' IS NULL OR n.provider = filters->>'provider')
    AND (filters->>'profile_id' IS NULL OR n.profile_id = (filters->>'profile_id')::uuid)
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

-- Create missing RPC functions for alerts

-- get_agri_rule_by_id
CREATE OR REPLACE FUNCTION get_agri_rule_by_id(rule_id uuid)
RETURNS TABLE (
  id uuid,
  code text,
  name text,
  description text,
  condition_sql text,
  action_type text,
  action_message text,
  severity text,
  is_active boolean,
  applicable_crops jsonb,
  applicable_regions jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.code,
    ar.name,
    ar.description,
    ar.condition_sql,
    ar.action_type,
    ar.action_message,
    ar.severity,
    ar.is_active,
    ar.applicable_crops,
    ar.applicable_regions,
    ar.created_at,
    ar.updated_at
  FROM agri_rules ar
  WHERE ar.id = rule_id;
END;
$$;

-- create_agri_rule
CREATE OR REPLACE FUNCTION create_agri_rule(
  rule_code text,
  rule_name text,
  rule_description text DEFAULT NULL,
  rule_condition_sql text DEFAULT NULL,
  rule_action_type text DEFAULT 'notification',
  rule_action_message text DEFAULT NULL,
  rule_severity text DEFAULT 'info',
  rule_is_active boolean DEFAULT true,
  rule_applicable_crops jsonb DEFAULT '[]',
  rule_applicable_regions jsonb DEFAULT '[]'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_rule_id uuid;
BEGIN
  INSERT INTO agri_rules (
    code, name, description, condition_sql, action_type, 
    action_message, severity, is_active, applicable_crops, applicable_regions
  ) VALUES (
    rule_code, rule_name, rule_description, rule_condition_sql, rule_action_type,
    rule_action_message, rule_severity, rule_is_active, rule_applicable_crops, rule_applicable_regions
  )
  RETURNING id INTO new_rule_id;
  
  RETURN new_rule_id;
END;
$$;

-- update_agri_rule
CREATE OR REPLACE FUNCTION update_agri_rule(
  rule_id uuid,
  rule_code text DEFAULT NULL,
  rule_name text DEFAULT NULL,
  rule_description text DEFAULT NULL,
  rule_condition_sql text DEFAULT NULL,
  rule_action_type text DEFAULT NULL,
  rule_action_message text DEFAULT NULL,
  rule_severity text DEFAULT NULL,
  rule_is_active boolean DEFAULT NULL,
  rule_applicable_crops jsonb DEFAULT NULL,
  rule_applicable_regions jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agri_rules SET
    code = COALESCE(rule_code, code),
    name = COALESCE(rule_name, name),
    description = COALESCE(rule_description, description),
    condition_sql = COALESCE(rule_condition_sql, condition_sql),
    action_type = COALESCE(rule_action_type, action_type),
    action_message = COALESCE(rule_action_message, action_message),
    severity = COALESCE(rule_severity, severity),
    is_active = COALESCE(rule_is_active, is_active),
    applicable_crops = COALESCE(rule_applicable_crops, applicable_crops),
    applicable_regions = COALESCE(rule_applicable_regions, applicable_regions),
    updated_at = now()
  WHERE id = rule_id;
  
  RETURN FOUND;
END;
$$;

-- delete_agri_rule
CREATE OR REPLACE FUNCTION delete_agri_rule(rule_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM agri_rules WHERE id = rule_id;
  RETURN FOUND;
END;
$$;

-- toggle_agri_rule_status
CREATE OR REPLACE FUNCTION toggle_agri_rule_status(rule_id uuid, new_status boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agri_rules SET 
    is_active = new_status,
    updated_at = now()
  WHERE id = rule_id;
  
  RETURN FOUND;
END;
$$;

-- test_agri_rule_condition
CREATE OR REPLACE FUNCTION test_agri_rule_condition(rule_id uuid)
RETURNS TABLE (
  success boolean,
  message text,
  affected_records integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record record;
  affected_count integer := 0;
  test_message text;
BEGIN
  -- Get the rule
  SELECT * INTO rule_record FROM agri_rules WHERE id = rule_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Règle non trouvée'::text, 0;
    RETURN;
  END IF;
  
  IF rule_record.condition_sql IS NULL OR rule_record.condition_sql = '' THEN
    RETURN QUERY SELECT false, 'Condition SQL vide'::text, 0;
    RETURN;
  END IF;
  
  -- Try to execute the condition (simplified test)
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM (' || rule_record.condition_sql || ') as test_query' INTO affected_count;
    test_message := 'Condition testée avec succès. ' || affected_count || ' enregistrements correspondants.';
    RETURN QUERY SELECT true, test_message, affected_count;
  EXCEPTION WHEN OTHERS THEN
    test_message := 'Erreur dans la condition SQL: ' || SQLERRM;
    RETURN QUERY SELECT false, test_message, 0;
  END;
END;
$$;

-- get_notification_stats
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_notifications bigint,
  pending_notifications bigint,
  delivered_notifications bigint,
  failed_notifications bigint,
  notifications_by_channel jsonb,
  notifications_by_status jsonb,
  delivery_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count bigint;
  pending_count bigint;
  delivered_count bigint;
  failed_count bigint;
  delivery_rate numeric;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_count FROM notifications;
  SELECT COUNT(*) INTO pending_count FROM notifications WHERE status = 'pending';
  SELECT COUNT(*) INTO delivered_count FROM notifications WHERE status = 'delivered';
  SELECT COUNT(*) INTO failed_count FROM notifications WHERE status = 'failed';
  
  -- Calculate delivery rate
  IF total_count > 0 THEN
    delivery_rate := (delivered_count::numeric / total_count::numeric) * 100;
  ELSE
    delivery_rate := 0;
  END IF;
  
  RETURN QUERY
  SELECT 
    total_count,
    pending_count,
    delivered_count,
    failed_count,
    (SELECT jsonb_object_agg(channel, count) 
     FROM (
       SELECT channel, COUNT(*) as count 
       FROM notifications 
       GROUP BY channel
     ) channel_stats) as notifications_by_channel,
    (SELECT jsonb_object_agg(status, count) 
     FROM (
       SELECT status, COUNT(*) as count 
       FROM notifications 
       GROUP BY status
     ) status_stats) as notifications_by_status,
    delivery_rate;
END;
$$;

-- resend_notification
CREATE OR REPLACE FUNCTION resend_notification(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications SET 
    status = 'pending',
    updated_at = now()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_agri_rules_with_filters(jsonb, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notifications_with_details(jsonb, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agri_rule_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_agri_rule(text, text, text, text, text, text, text, boolean, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_agri_rule(uuid, text, text, text, text, text, text, text, boolean, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_agri_rule(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_agri_rule_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION test_agri_rule_condition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION resend_notification(uuid) TO authenticated;
