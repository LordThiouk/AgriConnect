-- Ajoute une politique RLS pour permettre aux agents de lire les parcelles
-- qui appartiennent à un producteur assigné à l'une de leurs fiches.

alter table public.plots enable row level security;

-- Supprime l'ancienne politique si elle existe pour éviter les conflits
drop policy if exists "Agents can view plots for their assigned producers" on public.plots;

create policy "Agents can view plots for their assigned producers"
on public.plots for select
using (
  exists (
    select 1
    from public.farm_files ff
    where
      ff.responsible_producer_id = producer_id and
      ff.created_by = auth.uid()
  )
);
