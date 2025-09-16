-- Step 1: Populate the new 'plots' referential table from existing data.
-- It groups by the producer and the plot name to create a single entry
-- for each unique physical plot that has been recorded in any farm file.
INSERT INTO public.plots (producer_id, name, created_at, updated_at)
SELECT
    ff.responsible_producer_id,
    ffp.name,
    MIN(ffp.created_at), -- Use the earliest creation date as the plot's creation date
    MAX(ffp.updated_at)  -- Use the latest update date as the plot's update date
FROM
    public.farm_file_plots AS ffp
JOIN
    public.farm_files AS ff ON ffp.farm_file_id = ff.id
WHERE
    ff.responsible_producer_id IS NOT NULL AND ffp.name IS NOT NULL
GROUP BY
    ff.responsible_producer_id, ffp.name;

-- Step 2: Update the 'plot_id' in 'farm_file_plots' to link to the new referential.
-- This query matches each seasonal plot record to its corresponding entry
-- in the main 'plots' table based on the producer and the plot name.
UPDATE
    public.farm_file_plots AS ffp
SET
    plot_id = p.id
FROM
    public.plots AS p
JOIN
    public.farm_files AS ff ON p.producer_id = ff.responsible_producer_id
WHERE
    ffp.farm_file_id = ff.id AND p.name = ffp.name;

-- Step 3: Clean up any seasonal plot records that could not be linked.
-- This can happen with old test data that might be inconsistent.
DELETE FROM public.farm_file_plots WHERE plot_id IS NULL;

-- Step 4: Make the 'plot_id' column non-nullable.
-- Now that all existing records are linked and orphans are removed, we can enforce this constraint.
ALTER TABLE public.farm_file_plots
ALTER COLUMN plot_id SET NOT NULL;

-- Step 5: Rename the now-redundant 'name' column for clarity.
-- The plot's true identifier is now plots.name. This column is just a
-- snapshot of the name at the time the seasonal record was created.
ALTER TABLE public.farm_file_plots
RENAME COLUMN name TO name_season_snapshot;

COMMENT ON COLUMN public.farm_file_plots.name_season_snapshot IS 'Snapshot of the plot name at the time of farm file creation. The authoritative name is in the referenced plots table.';
