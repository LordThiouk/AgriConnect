alter table public.farm_files
drop constraint if exists farm_files_status_check;

alter table public.farm_files
add constraint farm_files_status_check
check (status in ('draft', 'validated', 'completed'));
