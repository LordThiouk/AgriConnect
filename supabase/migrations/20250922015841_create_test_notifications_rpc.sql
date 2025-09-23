-- Create a test function to verify filters work

CREATE OR REPLACE FUNCTION get_notifications_test(
  filters jsonb DEFAULT '{}',
  page integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  channel text,
  status text,
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
  FROM notifications n
  WHERE 
    (filters->>'channel' = '' OR filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' = '' OR filters->>'status' IS NULL OR n.status = filters->>'status');
  
  -- Return results
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.channel,
    n.status,
    total_count::bigint
  FROM notifications n
  WHERE 
    (filters->>'channel' = '' OR filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' = '' OR filters->>'status' IS NULL OR n.status = filters->>'status')
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_notifications_test IS 'Fonction de test pour vérifier que les filtres fonctionnent';
