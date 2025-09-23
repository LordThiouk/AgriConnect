-- Fix notifications RPC with a simple, working approach

-- Drop all existing versions
DROP FUNCTION IF EXISTS get_notifications_with_details(jsonb, integer, integer) CASCADE;

-- Create a simple, working function
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
  total_count bigint,
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
  
  -- Simple count query
  SELECT COUNT(*) INTO total_count
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (filters->>'channel' = '' OR filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' = '' OR filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'provider' = '' OR filters->>'provider' IS NULL OR n.provider = filters->>'provider')
    AND (filters->>'search' = '' OR filters->>'search' IS NULL OR n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%');
  
  -- Simple select query with same conditions
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
    total_count::bigint,
    COALESCE(p.display_name, 'Utilisateur inconnu') as profile_full_name,
    p.phone as profile_phone,
    p.role as profile_role
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (filters->>'channel' = '' OR filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' = '' OR filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'provider' = '' OR filters->>'provider' IS NULL OR n.provider = filters->>'provider')
    AND (filters->>'search' = '' OR filters->>'search' IS NULL OR n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%')
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_notifications_with_details IS 'Récupère les notifications avec détails et applique correctement les filtres (version simple)';
