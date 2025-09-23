-- Fix alerts RPC functions final - Corrections des types

-- Fix create_agri_rule - handle jsonb properly
DROP FUNCTION IF EXISTS create_agri_rule(text, text, text, text, text, text, text, boolean, jsonb, jsonb);

CREATE OR REPLACE FUNCTION create_agri_rule(
  rule_code text,
  rule_name text,
  rule_description text DEFAULT NULL,
  rule_condition_sql text DEFAULT NULL,
  rule_action_type text DEFAULT 'notification',
  rule_action_message text DEFAULT NULL,
  rule_severity text DEFAULT 'info',
  rule_is_active boolean DEFAULT true,
  rule_applicable_crops jsonb DEFAULT '[]'::jsonb,
  rule_applicable_regions jsonb DEFAULT '[]'::jsonb
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
    rule_action_message, rule_severity, rule_is_active, 
    rule_applicable_crops, 
    rule_applicable_regions
  )
  RETURNING id INTO new_rule_id;
  
  RETURN new_rule_id;
END;
$$;

-- Fix update_agri_rule - handle jsonb properly
DROP FUNCTION IF EXISTS update_agri_rule(uuid, text, text, text, text, text, text, text, boolean, jsonb, jsonb);

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

-- Fix get_notifications_with_details - remove message column that doesn't exist
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_agri_rule(text, text, text, text, text, text, text, boolean, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_agri_rule(uuid, text, text, text, text, text, text, text, boolean, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notifications_with_details(jsonb, integer, integer) TO authenticated;
