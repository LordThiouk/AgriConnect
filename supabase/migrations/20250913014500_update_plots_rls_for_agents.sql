-- Allow agents to insert/select plots when creating seasonal data for farm files they own

alter table if exists public.plots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plots' and policyname = 'plots_select_agents_owner'
  ) then
    create policy plots_select_agents_owner on public.plots
    for select using (
      exists (
        select 1
        from public.farm_files ff
        join public.farm_file_plots ffp on ffp.farm_file_id = ff.id and ffp.plot_id = plots.id
        where ff.created_by = auth.uid()
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plots' and policyname = 'plots_insert_agents_owner'
  ) then
    create policy plots_insert_agents_owner on public.plots
    for insert with check (
      -- allow insert when agent is creating seasonal data for a farm file they own
      exists (
        select 1
        from public.farm_files ff
        where ff.created_by = auth.uid()
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

comment on policy plots_insert_agents_owner on public.plots is 'Agents can insert plots when working on their own farm files';

