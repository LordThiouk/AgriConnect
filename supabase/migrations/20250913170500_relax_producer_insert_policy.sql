-- Relax producer insert policy: allow authenticated agents/admins/supervisors/coop_admin to insert

alter table public.producers enable row level security;

drop policy if exists "Agents can insert producers (role only)" on public.producers;

create policy "Agents can insert producers (role only)"
on public.producers for insert
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('agent','admin','supervisor','coop_admin')
  )
);


