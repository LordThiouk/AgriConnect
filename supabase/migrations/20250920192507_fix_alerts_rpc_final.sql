-- Fix alerts RPC functions - Corrections finales des types

-- Fix get_agri_rules_with_filters - corriger les types jsonb
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
    AND (filters->>'action_type' IS NULL OR ar.action_type = filters->>'action_type')
    AND (filters->>'search' IS NULL OR ar.name ILIKE '%' || (filters->>'search') || '%' OR ar.code ILIKE '%' || (filters->>'search') || '%');
  
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
    -- Convertir text[] en jsonb si nécessaire
    CASE 
      WHEN jsonb_typeof(ar.applicable_crops) = 'array' THEN ar.applicable_crops
      ELSE to_jsonb(ar.applicable_crops::text[])
    END as applicable_crops,
    CASE 
      WHEN jsonb_typeof(ar.applicable_regions) = 'array' THEN ar.applicable_regions
      ELSE to_jsonb(ar.applicable_regions::text[])
    END as applicable_regions,
    ar.created_at,
    ar.updated_at,
    total_count::bigint
  FROM agri_rules ar
  WHERE (filters->>'is_active' IS NULL OR ar.is_active = (filters->>'is_active')::boolean)
    AND (filters->>'severity' IS NULL OR ar.severity = filters->>'severity')
    AND (filters->>'action_type' IS NULL OR ar.action_type = filters->>'action_type')
    AND (filters->>'search' IS NULL OR ar.name ILIKE '%' || (filters->>'search') || '%' OR ar.code ILIKE '%' || (filters->>'search') || '%')
  ORDER BY ar.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

-- Fix get_notifications_with_details - supprimer la colonne type qui n'existe pas
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
    AND (filters->>'profile_id' IS NULL OR n.profile_id = (filters->>'profile_id')::uuid)
    AND (filters->>'search' IS NULL OR n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%');
  
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
    AND (filters->>'search' IS NULL OR n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%')
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_agri_rules_with_filters(jsonb, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notifications_with_details(jsonb, integer, integer) TO authenticated;
