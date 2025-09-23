-- Fix get_notifications_with_details filters - simplified approach

-- Drop the existing function
DROP FUNCTION IF EXISTS get_notifications_with_details(jsonb, integer, integer) CASCADE;

-- Create the corrected function with simple WHERE conditions
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
  channel_filter text;
  status_filter text;
  provider_filter text;
  profile_id_filter uuid;
  search_filter text;
BEGIN
  offset_val := (page - 1) * page_size;
  
  -- Extract filter values
  channel_filter := filters->>'channel';
  status_filter := filters->>'status';
  provider_filter := filters->>'provider';
  profile_id_filter := (filters->>'profile_id')::uuid;
  search_filter := filters->>'search';
  
  -- Get total count with proper filter application
  SELECT COUNT(*) INTO total_count
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (channel_filter IS NULL OR channel_filter = '' OR n.channel = channel_filter)
    AND (status_filter IS NULL OR status_filter = '' OR n.status = status_filter)
    AND (provider_filter IS NULL OR provider_filter = '' OR n.provider = provider_filter)
    AND (profile_id_filter IS NULL OR n.profile_id = profile_id_filter)
    AND (search_filter IS NULL OR search_filter = '' OR n.title ILIKE '%' || search_filter || '%' OR n.body ILIKE '%' || search_filter || '%');
  
  -- Return filtered results
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
    -- Profile details
    COALESCE(p.display_name, 'Utilisateur inconnu') as profile_full_name,
    p.phone as profile_phone,
    p.role as profile_role
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (channel_filter IS NULL OR channel_filter = '' OR n.channel = channel_filter)
    AND (status_filter IS NULL OR status_filter = '' OR n.status = status_filter)
    AND (provider_filter IS NULL OR provider_filter = '' OR n.provider = provider_filter)
    AND (profile_id_filter IS NULL OR n.profile_id = profile_id_filter)
    AND (search_filter IS NULL OR search_filter = '' OR n.title ILIKE '%' || search_filter || '%' OR n.body ILIKE '%' || search_filter || '%')
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_notifications_with_details IS 'Récupère les notifications avec détails et applique correctement les filtres (version corrigée)';
