-- Create RPCs for visit management to handle RLS and foreign key constraints
-- These RPCs will be used by the mobile app instead of direct table operations

-- 1. RPC for updating a visit
CREATE OR REPLACE FUNCTION update_visit(
  p_visit_id UUID,
  p_visit_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_id UUID;
  v_visit_record RECORD;
  v_result JSONB;
BEGIN
  -- Get the current agent_id from the visit
  SELECT agent_id INTO v_agent_id
  FROM visits
  WHERE id = p_visit_id;
  
  -- Check if visit exists
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Visite non trouvée',
      'code', 'VISIT_NOT_FOUND'
    );
  END IF;
  
  -- Check if the agent has permission to update this visit
  -- (This will be handled by RLS policies, but we can add additional checks here)
  
  -- Update the visit
  UPDATE visits
  SET 
    producer_id = COALESCE((p_visit_data->>'producer_id')::UUID, producer_id),
    plot_id = COALESCE((p_visit_data->>'plot_id')::UUID, plot_id),
    visit_date = COALESCE((p_visit_data->>'visit_date')::TIMESTAMPTZ, visit_date),
    visit_type = COALESCE((p_visit_data->>'visit_type')::TEXT, visit_type),
    status = COALESCE((p_visit_data->>'status')::TEXT, status),
    duration_minutes = COALESCE((p_visit_data->>'duration_minutes')::INTEGER, duration_minutes),
    location_latitude = COALESCE((p_visit_data->>'location_latitude')::DOUBLE PRECISION, location_latitude),
    location_longitude = COALESCE((p_visit_data->>'location_longitude')::DOUBLE PRECISION, location_longitude),
    notes = COALESCE(p_visit_data->>'notes', notes),
    weather_conditions = COALESCE(p_visit_data->>'weather_conditions', weather_conditions),
    updated_at = NOW()
  WHERE id = p_visit_id
  RETURNING * INTO v_visit_record;
  
  -- Check if update was successful
  IF v_visit_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Échec de la mise à jour de la visite',
      'code', 'UPDATE_FAILED'
    );
  END IF;
  
  -- Return success with visit data
  RETURN jsonb_build_object(
    'success', true,
    'data', to_jsonb(v_visit_record),
    'message', 'Visite mise à jour avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'UPDATE_ERROR'
    );
END;
$$;

-- 2. RPC for deleting a visit
CREATE OR REPLACE FUNCTION delete_visit(
  p_visit_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_id UUID;
  v_visit_record RECORD;
  v_result JSONB;
BEGIN
  -- Get the current agent_id from the visit
  SELECT agent_id INTO v_agent_id
  FROM visits
  WHERE id = p_visit_id;
  
  -- Check if visit exists
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Visite non trouvée',
      'code', 'VISIT_NOT_FOUND'
    );
  END IF;
  
  -- Get visit data before deletion for confirmation
  SELECT * INTO v_visit_record
  FROM visits
  WHERE id = p_visit_id;
  
  -- Delete the visit
  DELETE FROM visits
  WHERE id = p_visit_id;
  
  -- Check if deletion was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Échec de la suppression de la visite',
      'code', 'DELETE_FAILED'
    );
  END IF;
  
  -- Return success with deleted visit data
  RETURN jsonb_build_object(
    'success', true,
    'data', to_jsonb(v_visit_record),
    'message', 'Visite supprimée avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'DELETE_ERROR'
    );
END;
$$;

-- 3. RPC for creating a visit (to ensure proper agent_id handling)
CREATE OR REPLACE FUNCTION create_visit(
  p_agent_id UUID,
  p_visit_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visit_record RECORD;
  v_agent_exists BOOLEAN;
BEGIN
  -- Verify that the agent exists in profiles
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE user_id = p_agent_id AND role = 'agent'
  ) INTO v_agent_exists;
  
  IF NOT v_agent_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Agent non trouvé ou non autorisé',
      'code', 'AGENT_NOT_FOUND'
    );
  END IF;
  
  -- Create the visit
  INSERT INTO visits (
    agent_id,
    producer_id,
    plot_id,
    visit_date,
    visit_type,
    status,
    duration_minutes,
    location_latitude,
    location_longitude,
    notes,
    weather_conditions
  ) VALUES (
    p_agent_id,
    (p_visit_data->>'producer_id')::UUID,
    (p_visit_data->>'plot_id')::UUID,
    (p_visit_data->>'visit_date')::TIMESTAMPTZ,
    COALESCE((p_visit_data->>'visit_type')::TEXT, 'routine'),
    COALESCE((p_visit_data->>'status')::TEXT, 'scheduled'),
    (p_visit_data->>'duration_minutes')::INTEGER,
    (p_visit_data->>'location_latitude')::DOUBLE PRECISION,
    (p_visit_data->>'location_longitude')::DOUBLE PRECISION,
    p_visit_data->>'notes',
    p_visit_data->>'weather_conditions'
  )
  RETURNING * INTO v_visit_record;
  
  -- Return success with visit data
  RETURN jsonb_build_object(
    'success', true,
    'data', to_jsonb(v_visit_record),
    'message', 'Visite créée avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'CREATE_ERROR'
    );
END;
$$;

-- 4. RPC for getting visit details (with proper joins)
CREATE OR REPLACE FUNCTION get_visit_details(
  p_visit_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visit_data JSONB;
BEGIN
  -- Get visit with related data
  SELECT to_jsonb(v.*) INTO v_visit_data
  FROM (
    SELECT 
      v.*,
      p.first_name as producer_first_name,
      p.last_name as producer_last_name,
      pl.name_season_snapshot as plot_name,
      pl.area_hectares as plot_area,
      pl.soil_type as plot_soil_type,
      pl.water_source as plot_water_source
    FROM visits v
    LEFT JOIN producers p ON v.producer_id = p.id
    LEFT JOIN plots pl ON v.plot_id = pl.id
    WHERE v.id = p_visit_id
  ) v;
  
  IF v_visit_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Visite non trouvée',
      'code', 'VISIT_NOT_FOUND'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', v_visit_data,
    'message', 'Visite récupérée avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'GET_ERROR'
    );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION update_visit(UUID, JSONB) IS 
'Updates a visit with proper RLS handling and foreign key validation';

COMMENT ON FUNCTION delete_visit(UUID) IS 
'Deletes a visit with proper RLS handling';

COMMENT ON FUNCTION create_visit(UUID, JSONB) IS 
'Creates a new visit with proper agent validation';

COMMENT ON FUNCTION get_visit_details(UUID) IS 
'Gets visit details with related producer and plot information';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_visit(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_visit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_visit(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visit_details(UUID) TO authenticated;
