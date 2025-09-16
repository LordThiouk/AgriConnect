-- Temporary permissive policy to unblock inserts during collection (MVP)
alter table public.producers enable row level security;

drop policy if exists "Authenticated can insert producers" on public.producers;

create policy "Authenticated can insert producers"
on public.producers for insert
with check ( auth.role() = 'authenticated' );


