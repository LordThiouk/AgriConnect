-- Enable RLS on the plots table if not already enabled
alter table public.plots enable row level security;

-- Drop any existing insert policy to avoid conflicts
drop policy if exists "Agents can insert plots for their own farm files" on public.plots;

-- Create the new insert policy
create policy "Agents can insert plots for their own farm files"
on public.plots for insert
with check (
  exists (
    select 1
    from public.farm_files ff
    where ff.id = farm_file_id and ff.created_by = auth.uid()
  )
);
