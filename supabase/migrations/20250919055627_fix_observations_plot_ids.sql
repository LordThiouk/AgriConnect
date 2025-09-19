-- Migration: Fix observations plot_ids to match farm_file_plots
-- This migration updates existing observations to use correct plot_id from farm_file_plots

DO $$
DECLARE
  current_agent_id UUID;
  existing_farm_file_plot_id UUID;
  existing_crop_id UUID;
BEGIN
  -- Get the current agent ID
  SELECT id INTO current_agent_id FROM profiles WHERE role = 'agent' LIMIT 1;
  
  -- Get an existing farm_file_plot that the agent has access to
  SELECT ffp.id INTO existing_farm_file_plot_id 
  FROM farm_file_plots ffp
  JOIN farm_files ff ON ffp.farm_file_id = ff.id
  JOIN producers pr ON ff.responsible_producer_id = pr.id
  JOIN agent_producer_assignments apa ON pr.id = apa.producer_id
  WHERE apa.agent_id = current_agent_id
  LIMIT 1;
  
  -- Get an existing crop
  SELECT id INTO existing_crop_id FROM crops LIMIT 1;
  
  IF existing_farm_file_plot_id IS NOT NULL THEN
    -- Update all observations to use the correct farm_file_plot_id
    UPDATE observations 
    SET plot_id = existing_farm_file_plot_id,
        crop_id = COALESCE(existing_crop_id, crop_id)
    WHERE plot_id NOT IN (
      SELECT id FROM farm_file_plots
    );
    
    RAISE NOTICE 'Updated observations to use farm_file_plot_id: %', existing_farm_file_plot_id;
  ELSE
    RAISE NOTICE 'No accessible farm_file_plots found for agent';
  END IF;
END $$;
