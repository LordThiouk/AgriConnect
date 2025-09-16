-- First, drop the existing constraint
ALTER TABLE public.crops DROP CONSTRAINT IF EXISTS crops_crop_type_check;

-- Then, add the new constraint with the updated list of values
ALTER TABLE public.crops ADD CONSTRAINT crops_crop_type_check 
CHECK (crop_type IN (
    'Cotton', 
    'Maize', -- Added Maize
    'Sorghum', 
    'Millet', 
    'Groundnut', 
    'Cowpea',
    'Other'
));
