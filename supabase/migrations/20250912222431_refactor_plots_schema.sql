-- Step 1: Rename the existing 'plots' table to 'farm_file_plots'.
-- This table will now hold seasonal data linked to a specific farm file.
ALTER TABLE public.plots RENAME TO farm_file_plots;

-- Step 2: Create the new 'plots' table.
-- This table will act as a central, long-term referential for all physical plots.
CREATE TABLE public.plots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT plots_producer_id_name_key UNIQUE (producer_id, name)
);

-- Enable RLS for the new plots table
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

-- Step 3: Add a nullable 'plot_id' foreign key to the 'farm_file_plots' table.
-- This column will link the seasonal plot data back to the main plot referential.
-- It is created as nullable to allow for a separate data migration step.
ALTER TABLE public.farm_file_plots
ADD COLUMN plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL;

-- Step 4: Add comments to the new tables and columns for clarity
COMMENT ON TABLE public.plots IS 'Referential of all physical farm plots. Stores long-term, non-seasonal data.';
COMMENT ON COLUMN public.plots.name IS 'Unique user-defined identifier for the plot (e.g., "P1", "Champ du fond"). Unique per producer.';
COMMENT ON TABLE public.farm_file_plots IS 'Seasonal data for a specific plot within the context of a farm file (fiche d''exploitation).';
COMMENT ON COLUMN public.farm_file_plots.plot_id IS 'Foreign key linking to the central plot referential.';
