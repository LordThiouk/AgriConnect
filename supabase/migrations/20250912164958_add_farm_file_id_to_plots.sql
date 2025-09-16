alter table public.plots
add column if not exists farm_file_id uuid;

alter table public.plots
add constraint fk_plots_farm_file
foreign key (farm_file_id)
references public.farm_files(id)
on delete cascade;
