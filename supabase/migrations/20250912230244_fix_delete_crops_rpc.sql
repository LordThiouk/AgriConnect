-- Description: Updates the RPC function to correctly delete crops associated with a farm file
-- by using the new `farm_file_plots` table as the link.

CREATE OR REPLACE FUNCTION public.delete_crops_for_farm_file(p_farm_file_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.crops c
  WHERE c.farm_file_plot_id IN (
    SELECT ffp.id
    FROM public.farm_file_plots ffp
    WHERE ffp.farm_file_id = p_farm_file_id
  );
END;
$$;
