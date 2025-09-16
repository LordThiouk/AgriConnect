-- Add area_hectares to crops for per-crop surface

alter table if exists public.crops
  add column if not exists area_hectares numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'crops_area_hectares_nonneg_check'
      and conrelid = 'public.crops'::regclass
  ) then
    alter table public.crops
      add constraint crops_area_hectares_nonneg_check
      check (area_hectares is null or area_hectares >= 0);
  end if;
end $$;

comment on column public.crops.area_hectares is 'Surface de la culture en hectares';

