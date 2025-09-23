-- Create a new notifications RPC function that properly applies filters

-- Drop the existing function completely
DROP FUNCTION IF EXISTS get_notifications_with_details(jsonb, integer, integer) CASCADE;

-- Create a completely new function with a different approach
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
  where_clause text := '';
  params text[];
  param_count integer := 0;
BEGIN
  offset_val := (page - 1) * page_size;
  
  -- Build dynamic WHERE clause
  IF filters->>'channel' IS NOT NULL AND filters->>'channel' != '' THEN
    param_count := param_count + 1;
    where_clause := where_clause || ' AND n.channel = $' || param_count;
    params := params || (filters->>'channel');
  END IF;
  
  IF filters->>'status' IS NOT NULL AND filters->>'status' != '' THEN
    param_count := param_count + 1;
    where_clause := where_clause || ' AND n.status = $' || param_count;
    params := params || (filters->>'status');
  END IF;
  
  IF filters->>'provider' IS NOT NULL AND filters->>'provider' != '' THEN
    param_count := param_count + 1;
    where_clause := where_clause || ' AND n.provider = $' || param_count;
    params := params || (filters->>'provider');
  END IF;
  
  IF filters->>'profile_id' IS NOT NULL AND filters->>'profile_id' != '' THEN
    param_count := param_count + 1;
    where_clause := where_clause || ' AND n.profile_id = $' || param_count;
    params := params || (filters->>'profile_id')::text;
  END IF;
  
  IF filters->>'search' IS NOT NULL AND filters->>'search' != '' THEN
    param_count := param_count + 1;
    where_clause := where_clause || ' AND (n.title ILIKE $' || param_count || ' OR n.body ILIKE $' || param_count || ')';
    params := params || ('%' || (filters->>'search') || '%');
  END IF;
  
  -- Remove leading ' AND ' if exists
  IF where_clause != '' THEN
    where_clause := 'WHERE ' || substring(where_clause from 6);
  END IF;
  
  -- Get total count
  EXECUTE 'SELECT COUNT(*) FROM notifications n LEFT JOIN profiles p ON n.profile_id = p.id ' || where_clause
  INTO total_count
  USING params;
  
  -- Return results
  RETURN QUERY
  EXECUTE 'SELECT 
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
    ' || total_count || '::bigint as total_count,
    COALESCE(p.display_name, ''Utilisateur inconnu'') as profile_full_name,
    p.phone as profile_phone,
    p.role as profile_role
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  ' || where_clause || '
  ORDER BY n.created_at DESC
  LIMIT $' || (param_count + 1) || ' OFFSET $' || (param_count + 2)
  USING params || page_size || offset_val;
END;
$$;

COMMENT ON FUNCTION get_notifications_with_details IS 'Récupère les notifications avec détails et applique correctement les filtres (version dynamique)';
