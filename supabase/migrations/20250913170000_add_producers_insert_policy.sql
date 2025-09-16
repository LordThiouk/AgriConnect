-- Allow agents to INSERT producers for their own cooperative

-- Ensure RLS is enabled
alter table public.producers enable row level security;

-- Clean previous similar policies to avoid conflicts
drop policy if exists "Agents can insert producers in their cooperative" on public.producers;

create policy "Agents can insert producers in their cooperative"
on public.producers for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (p.role = 'agent' or p.role = 'supervisor' or p.role = 'coop_admin' or p.role = 'admin')
      and coalesce(p.cooperative, '') = coalesce(public.producers.cooperative_id::text, '')
  )
);


