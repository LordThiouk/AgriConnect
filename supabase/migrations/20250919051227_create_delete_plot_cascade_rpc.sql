-- RPC function to safely delete a plot with all related data
-- This function handles the complex cascade deletion for plots

CREATE OR REPLACE FUNCTION public.delete_plot_cascade(plot_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  deleted_crops_count INTEGER := 0;
  deleted_farm_file_plots_count INTEGER := 0;
  deleted_operations_count INTEGER := 0;
  deleted_observations_count INTEGER := 0;
  deleted_recommendations_count INTEGER := 0;
  deleted_media_count INTEGER := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Delete operations related to crops that will be deleted
    DELETE FROM public.operations 
    WHERE crop_id IN (
      SELECT c.id 
      FROM public.crops c
      WHERE c.plot_id = plot_id_param 
         OR c.farm_file_plot_id IN (
           SELECT ffp.id 
           FROM public.farm_file_plots ffp 
           WHERE ffp.plot_id = plot_id_param
         )
    );
    GET DIAGNOSTICS deleted_operations_count = ROW_COUNT;

    -- 2. Delete observations related to crops that will be deleted
    DELETE FROM public.observations 
    WHERE crop_id IN (
      SELECT c.id 
      FROM public.crops c
      WHERE c.plot_id = plot_id_param 
         OR c.farm_file_plot_id IN (
           SELECT ffp.id 
           FROM public.farm_file_plots ffp 
           WHERE ffp.plot_id = plot_id_param
         )
    );
    GET DIAGNOSTICS deleted_observations_count = ROW_COUNT;

    -- 3. Delete recommendations related to the plot or its crops
    DELETE FROM public.recommendations 
    WHERE plot_id = plot_id_param 
       OR crop_id IN (
         SELECT c.id 
         FROM public.crops c
         WHERE c.plot_id = plot_id_param 
            OR c.farm_file_plot_id IN (
              SELECT ffp.id 
              FROM public.farm_file_plots ffp 
              WHERE ffp.plot_id = plot_id_param
            )
       );
    GET DIAGNOSTICS deleted_recommendations_count = ROW_COUNT;

    -- 4. Delete media related to the plot
    DELETE FROM public.media 
    WHERE entity_type = 'plot' AND entity_id = plot_id_param;
    GET DIAGNOSTICS deleted_media_count = ROW_COUNT;

    -- 5. Delete crops (both by plot_id and farm_file_plot_id)
    DELETE FROM public.crops 
    WHERE plot_id = plot_id_param 
       OR farm_file_plot_id IN (
         SELECT ffp.id 
         FROM public.farm_file_plots ffp 
         WHERE ffp.plot_id = plot_id_param
       );
    GET DIAGNOSTICS deleted_crops_count = ROW_COUNT;

    -- 6. Delete farm_file_plots
    DELETE FROM public.farm_file_plots 
    WHERE plot_id = plot_id_param;
    GET DIAGNOSTICS deleted_farm_file_plots_count = ROW_COUNT;

    -- 7. Finally delete the plot
    DELETE FROM public.plots 
    WHERE id = plot_id_param;

    -- Return success result
    result := json_build_object(
      'success', true,
      'deleted_operations', deleted_operations_count,
      'deleted_observations', deleted_observations_count,
      'deleted_recommendations', deleted_recommendations_count,
      'deleted_media', deleted_media_count,
      'deleted_crops', deleted_crops_count,
      'deleted_farm_file_plots', deleted_farm_file_plots_count,
      'message', 'Plot and all related data deleted successfully'
    );

    RETURN result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback and return error
      result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to delete plot: ' || SQLERRM
      );
      RETURN result;
  END;
END;
$$;
