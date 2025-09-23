-- Fix get_notifications_with_details to properly apply filters

-- Drop the existing function
DROP FUNCTION IF EXISTS get_notifications_with_details(jsonb, integer, integer) CASCADE;

-- Create the corrected function that properly applies filters
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
BEGIN
  offset_val := (page - 1) * page_size;
  
  -- Debug: Log the filters received
  RAISE NOTICE 'Filters received: %', filters;
  RAISE NOTICE 'Channel filter: %', filters->>'channel';
  RAISE NOTICE 'Status filter: %', filters->>'status';
  
  -- Get total count with proper filter application
  SELECT COUNT(*) INTO total_count
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    -- Channel filter
    CASE 
      WHEN filters->>'channel' IS NULL OR filters->>'channel' = '' THEN TRUE
      ELSE n.channel = filters->>'channel'
    END
    -- Status filter
    AND CASE 
      WHEN filters->>'status' IS NULL OR filters->>'status' = '' THEN TRUE
      ELSE n.status = filters->>'status'
    END
    -- Provider filter
    AND CASE 
      WHEN filters->>'provider' IS NULL OR filters->>'provider' = '' THEN TRUE
      ELSE n.provider = filters->>'provider'
    END
    -- Profile ID filter
    AND CASE 
      WHEN filters->>'profile_id' IS NULL OR filters->>'profile_id' = '' THEN TRUE
      ELSE n.profile_id = (filters->>'profile_id')::uuid
    END
    -- Search filter
    AND CASE 
      WHEN filters->>'search' IS NULL OR filters->>'search' = '' THEN TRUE
      ELSE (n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%')
    END;
  
  RAISE NOTICE 'Total count after filters: %', total_count;
  
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
    -- Apply the same filters as in the count query
    CASE 
      WHEN filters->>'channel' IS NULL OR filters->>'channel' = '' THEN TRUE
      ELSE n.channel = filters->>'channel'
    END
    AND CASE 
      WHEN filters->>'status' IS NULL OR filters->>'status' = '' THEN TRUE
      ELSE n.status = filters->>'status'
    END
    AND CASE 
      WHEN filters->>'provider' IS NULL OR filters->>'provider' = '' THEN TRUE
      ELSE n.provider = filters->>'provider'
    END
    AND CASE 
      WHEN filters->>'profile_id' IS NULL OR filters->>'profile_id' = '' THEN TRUE
      ELSE n.profile_id = (filters->>'profile_id')::uuid
    END
    AND CASE 
      WHEN filters->>'search' IS NULL OR filters->>'search' = '' THEN TRUE
      ELSE (n.title ILIKE '%' || (filters->>'search') || '%' OR n.body ILIKE '%' || (filters->>'search') || '%')
    END
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_notifications_with_details IS 'Récupère les notifications avec détails et applique correctement les filtres';
