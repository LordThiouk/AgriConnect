alter table public.plots
add column if not exists area_hectares numeric,
add column if not exists typology text,
add column if not exists producer_size text,
add column if not exists cotton_variety text;
