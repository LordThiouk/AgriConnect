-- RLS Policies for crops table

-- Enable RLS on the table if it's not already
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- 1. Policy for INSERT
CREATE POLICY "Allow authenticated users to insert their own crops"
ON public.crops
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 2. Policy for SELECT
CREATE POLICY "Allow users to view their own crops or crops on their plots"
ON public.crops
FOR SELECT
USING (
  auth.uid() = created_by OR
  (
    SELECT 1
    FROM farm_file_plots ffp
    JOIN farm_files ff ON ffp.farm_file_id = ff.id
    WHERE ffp.plot_id = crops.plot_id AND ff.created_by = auth.uid()
  ) = 1
);

-- 3. Policy for UPDATE
CREATE POLICY "Allow users to update their own crops"
ON public.crops
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- 4. Policy for DELETE
CREATE POLICY "Allow users to delete their own crops"
ON public.crops
FOR DELETE
USING (auth.uid() = created_by);
