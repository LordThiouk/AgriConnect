-- Add a foreign key to the 'crops' table to link it directly to a seasonal 'farm_file_plots' entry.
-- This creates a clear link between a crop and a specific agricultural campaign/season.

ALTER TABLE public.crops
ADD COLUMN farm_file_plot_id UUID REFERENCES public.farm_file_plots(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.crops.farm_file_plot_id IS 'Links the crop to a specific seasonal plot record, providing campaign context.';

-- Add an index for performance on the new foreign key.
CREATE INDEX IF NOT EXISTS idx_crops_farm_file_plot_id ON public.crops(farm_file_plot_id);
