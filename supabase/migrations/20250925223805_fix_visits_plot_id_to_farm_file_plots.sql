-- Fix visits.plot_id to reference farm_file_plots.id instead of plots.id

-- 1. Drop the existing foreign key constraint first
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_plot_id_fkey;

-- 2. Update existing visits to use farm_file_plots.id instead of plots.id
-- Map visits to farm_file_plots based on producer_id
UPDATE visits 
SET plot_id = (
    SELECT ffp.id 
    FROM farm_file_plots ffp 
    WHERE ffp.producer_id = visits.producer_id 
    LIMIT 1
)
WHERE visits.producer_id IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM farm_file_plots ffp 
    WHERE ffp.producer_id = visits.producer_id
);

-- 3. For any visits that couldn't be mapped, set plot_id to NULL
UPDATE visits 
SET plot_id = NULL 
WHERE plot_id NOT IN (SELECT id FROM farm_file_plots);

-- 4. Add the new foreign key constraint to farm_file_plots
ALTER TABLE visits 
ADD CONSTRAINT visits_plot_id_fkey 
FOREIGN KEY (plot_id) REFERENCES farm_file_plots(id) ON DELETE CASCADE;

-- 5. Add a comment to document the change
COMMENT ON COLUMN visits.plot_id IS 'References farm_file_plots.id - the actual plot data used in the application';
