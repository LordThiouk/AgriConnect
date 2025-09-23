-- ===== RPC FUNCTIONS FOR ALERTS & RECOMMENDATIONS =====

-- 1. Get recommendations with details (producer, plot, crop info)
CREATE OR REPLACE FUNCTION get_recommendations_with_details(
  filters JSONB DEFAULT '{}'::jsonb,
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  crop_id UUID,
  plot_id UUID,
  producer_id UUID,
  rule_code TEXT,
  title TEXT,
  message TEXT,
  recommendation_type TEXT,
  priority TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Producer details
  producer_first_name TEXT,
  producer_last_name TEXT,
  producer_phone TEXT,
  producer_region TEXT,
  producer_cooperative_id UUID,
  producer_cooperative_name TEXT,
  -- Plot details
  plot_name TEXT,
  plot_area_hectares NUMERIC,
  plot_soil_type TEXT,
  plot_water_source TEXT,
  plot_status TEXT,
  -- Crop details
  crop_crop_type TEXT,
  crop_variety TEXT,
  crop_sowing_date DATE,
  crop_status TEXT,
  -- Pagination
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  total_count_val BIGINT;
BEGIN
  -- Calculate offset
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id');

  -- Return paginated results
  RETURN QUERY
  SELECT 
    r.id,
    r.crop_id,
    r.plot_id,
    r.producer_id,
    r.rule_code,
    r.title,
    r.message,
    r.recommendation_type,
    r.priority,
    r.status,
    r.sent_at,
    r.acknowledged_at,
    r.completed_at,
    r.created_at,
    r.updated_at,
    -- Producer details
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.phone as producer_phone,
    p.region as producer_region,
    p.cooperative_id as producer_cooperative_id,
    co.name as producer_cooperative_name,
    -- Plot details
    pl.name as plot_name,
    pl.area_hectares as plot_area_hectares,
    pl.soil_type as plot_soil_type,
    pl.water_source as plot_water_source,
    pl.status as plot_status,
    -- Crop details
    c.crop_type as crop_crop_type,
    c.variety as crop_variety,
    c.sowing_date as crop_sowing_date,
    c.status as crop_status,
    -- Total count
    total_count_val as total_count
  FROM recommendations r
  LEFT JOIN producers p ON r.producer_id = p.id
  LEFT JOIN plots pl ON r.plot_id = pl.id
  LEFT JOIN crops c ON r.crop_id = c.id
  LEFT JOIN cooperatives co ON p.cooperative_id = co.id
  WHERE 
    (filters->>'search' IS NULL OR 
     r.title ILIKE '%' || (filters->>'search') || '%' OR 
     r.message ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'recommendation_type' IS NULL OR r.recommendation_type = filters->>'recommendation_type')
    AND (filters->>'priority' IS NULL OR r.priority = filters->>'priority')
    AND (filters->>'status' IS NULL OR r.status = filters->>'status')
    AND (filters->>'producer_id' IS NULL OR r.producer_id::text = filters->>'producer_id')
    AND (filters->>'region' IS NULL OR p.region = filters->>'region')
    AND (filters->>'cooperative_id' IS NULL OR p.cooperative_id::text = filters->>'cooperative_id')
  ORDER BY r.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

-- 2. Get recommendation statistics
CREATE OR REPLACE FUNCTION get_recommendation_stats()
RETURNS TABLE (
  total_recommendations BIGINT,
  pending_recommendations BIGINT,
  completed_recommendations BIGINT,
  critical_recommendations BIGINT,
  recommendations_by_type JSONB,
  recommendations_by_priority JSONB,
  recommendations_by_status JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_recommendations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_recommendations,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_recommendations,
    COUNT(*) FILTER (WHERE priority = 'urgent') as critical_recommendations,
    jsonb_object_agg(
      recommendation_type, 
      type_count
    ) as recommendations_by_type,
    jsonb_object_agg(
      priority, 
      priority_count
    ) as recommendations_by_priority,
    jsonb_object_agg(
      status, 
      status_count
    ) as recommendations_by_status
  FROM (
    SELECT 
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE priority = 'urgent') as critical_count
    FROM recommendations
  ) main_stats
  CROSS JOIN (
    SELECT 
      recommendation_type,
      COUNT(*) as type_count
    FROM recommendations
    GROUP BY recommendation_type
  ) type_stats
  CROSS JOIN (
    SELECT 
      priority,
      COUNT(*) as priority_count
    FROM recommendations
    GROUP BY priority
  ) priority_stats
  CROSS JOIN (
    SELECT 
      status,
      COUNT(*) as status_count
    FROM recommendations
    GROUP BY status
  ) status_stats;
END;
$$;

-- 3. Update recommendation status
CREATE OR REPLACE FUNCTION update_recommendation_status(
  recommendation_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE recommendations 
  SET 
    status = new_status,
    updated_at = NOW(),
    sent_at = CASE 
      WHEN new_status = 'sent' AND sent_at IS NULL THEN NOW()
      ELSE sent_at
    END,
    acknowledged_at = CASE 
      WHEN new_status = 'acknowledged' AND acknowledged_at IS NULL THEN NOW()
      ELSE acknowledged_at
    END,
    completed_at = CASE 
      WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END
  WHERE id = recommendation_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 4. Get agri rules with filters
CREATE OR REPLACE FUNCTION get_agri_rules_with_filters(
  filters JSONB DEFAULT '{}'::jsonb,
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  description TEXT,
  condition_sql TEXT,
  action_type TEXT,
  action_message TEXT,
  severity TEXT,
  is_active BOOLEAN,
  applicable_crops TEXT[],
  applicable_regions TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  total_count_val BIGINT;
BEGIN
  -- Calculate offset
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM agri_rules
  WHERE 
    (filters->>'search' IS NULL OR 
     name ILIKE '%' || (filters->>'search') || '%' OR 
     COALESCE(description, '') ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'action_type' IS NULL OR action_type = filters->>'action_type')
    AND (filters->>'severity' IS NULL OR severity = filters->>'severity')
    AND (filters->>'is_active' IS NULL OR is_active::text = filters->>'is_active');

  -- Return paginated results
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
    total_count_val as total_count
  FROM agri_rules ar
  WHERE 
    (filters->>'search' IS NULL OR 
     ar.name ILIKE '%' || (filters->>'search') || '%' OR 
     COALESCE(ar.description, '') ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'action_type' IS NULL OR ar.action_type = filters->>'action_type')
    AND (filters->>'severity' IS NULL OR ar.severity = filters->>'severity')
    AND (filters->>'is_active' IS NULL OR ar.is_active::text = filters->>'is_active')
  ORDER BY ar.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

-- 5. Get notifications with details
CREATE OR REPLACE FUNCTION get_notifications_with_details(
  filters JSONB DEFAULT '{}'::jsonb,
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  title TEXT,
  body TEXT,
  channel TEXT,
  provider TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Profile details
  profile_first_name TEXT,
  profile_last_name TEXT,
  profile_email TEXT,
  profile_role TEXT,
  -- Pagination
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  total_count_val BIGINT;
BEGIN
  -- Calculate offset
  offset_val := (page - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (filters->>'search' IS NULL OR 
     n.title ILIKE '%' || (filters->>'search') || '%' OR 
     n.body ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'profile_id' IS NULL OR n.profile_id::text = filters->>'profile_id')
    AND (filters->>'sent_from' IS NULL OR n.sent_at >= (filters->>'sent_from')::timestamptz)
    AND (filters->>'sent_to' IS NULL OR n.sent_at <= (filters->>'sent_to')::timestamptz);

  -- Return paginated results
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
    n.error_message,
    n.metadata,
    n.created_at,
    n.updated_at,
    -- Profile details
    p.first_name as profile_first_name,
    p.last_name as profile_last_name,
    p.email as profile_email,
    p.role as profile_role,
    -- Total count
    total_count_val as total_count
  FROM notifications n
  LEFT JOIN profiles p ON n.profile_id = p.id
  WHERE 
    (filters->>'search' IS NULL OR 
     n.title ILIKE '%' || (filters->>'search') || '%' OR 
     n.body ILIKE '%' || (filters->>'search') || '%')
    AND (filters->>'channel' IS NULL OR n.channel = filters->>'channel')
    AND (filters->>'status' IS NULL OR n.status = filters->>'status')
    AND (filters->>'profile_id' IS NULL OR n.profile_id::text = filters->>'profile_id')
    AND (filters->>'sent_from' IS NULL OR n.sent_at >= (filters->>'sent_from')::timestamptz)
    AND (filters->>'sent_to' IS NULL OR n.sent_at <= (filters->>'sent_to')::timestamptz)
  ORDER BY n.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

-- 6. Get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_notifications BIGINT,
  pending_notifications BIGINT,
  delivered_notifications BIGINT,
  failed_notifications BIGINT,
  notifications_by_channel JSONB,
  notifications_by_status JSONB,
  delivery_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_notifications,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_notifications,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_notifications,
    jsonb_object_agg(
      channel, 
      channel_count
    ) as notifications_by_channel,
    jsonb_object_agg(
      status, 
      status_count
    ) as notifications_by_status,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')), 0)) * 100, 
      2
    ) as delivery_rate
  FROM (
    SELECT 
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count
    FROM notifications
  ) main_stats
  CROSS JOIN (
    SELECT 
      channel,
      COUNT(*) as channel_count
    FROM notifications
    GROUP BY channel
  ) channel_stats
  CROSS JOIN (
    SELECT 
      status,
      COUNT(*) as status_count
    FROM notifications
    GROUP BY status
  ) status_stats;
END;
$$;

-- 7. Create recommendation
CREATE OR REPLACE FUNCTION create_recommendation(
  recommendation_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO recommendations (
    crop_id,
    plot_id,
    producer_id,
    rule_code,
    title,
    message,
    recommendation_type,
    priority,
    status,
    created_at,
    updated_at
  ) VALUES (
    (recommendation_data->>'crop_id')::UUID,
    (recommendation_data->>'plot_id')::UUID,
    (recommendation_data->>'producer_id')::UUID,
    recommendation_data->>'rule_code',
    recommendation_data->>'title',
    recommendation_data->>'message',
    recommendation_data->>'recommendation_type',
    recommendation_data->>'priority',
    COALESCE(recommendation_data->>'status', 'pending'),
    NOW(),
    NOW()
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- 8. Update recommendation
CREATE OR REPLACE FUNCTION update_recommendation(
  recommendation_id UUID,
  recommendation_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE recommendations 
  SET 
    crop_id = COALESCE((recommendation_data->>'crop_id')::UUID, crop_id),
    plot_id = COALESCE((recommendation_data->>'plot_id')::UUID, plot_id),
    producer_id = COALESCE((recommendation_data->>'producer_id')::UUID, producer_id),
    rule_code = COALESCE(recommendation_data->>'rule_code', rule_code),
    title = COALESCE(recommendation_data->>'title', title),
    message = COALESCE(recommendation_data->>'message', message),
    recommendation_type = COALESCE(recommendation_data->>'recommendation_type', recommendation_type),
    priority = COALESCE(recommendation_data->>'priority', priority),
    status = COALESCE(recommendation_data->>'status', status),
    updated_at = NOW()
  WHERE id = recommendation_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 9. Delete recommendation
CREATE OR REPLACE FUNCTION delete_recommendation(
  recommendation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM recommendations WHERE id = recommendation_id;
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows > 0;
END;
$$;

-- 10. Test agri rule condition
CREATE OR REPLACE FUNCTION test_agri_rule_condition(
  rule_id UUID,
  test_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  condition_met BOOLEAN,
  result_message TEXT,
  test_results JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_condition TEXT;
  rule_action_type TEXT;
  rule_action_message TEXT;
  condition_result BOOLEAN;
  result_msg TEXT;
BEGIN
  -- Get rule details
  SELECT condition_sql, action_type, action_message 
  INTO rule_condition, rule_action_type, rule_action_message
  FROM agri_rules 
  WHERE id = rule_id;
  
  IF rule_condition IS NULL THEN
    RETURN QUERY SELECT false, 'Rule not found', '{}'::jsonb;
    RETURN;
  END IF;
  
  -- For now, return a simple test result
  -- In a real implementation, you would parse and execute the SQL condition
  condition_result := true; -- Placeholder
  result_msg := 'Condition test completed - ' || rule_action_type || ': ' || rule_action_message;
  
  RETURN QUERY SELECT 
    condition_result,
    result_msg,
    jsonb_build_object(
      'rule_id', rule_id,
      'condition', rule_condition,
      'action_type', rule_action_type,
      'test_data', test_data,
      'tested_at', NOW()
    );
END;
$$;
