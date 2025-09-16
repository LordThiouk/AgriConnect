-- Ajoute une politique RLS pour permettre aux agents de lire les producteurs qui leur sont assignés.
-- Un agent peut lire les informations d'un producteur si ce dernier est lié à une fiche
-- d'exploitation (`farm_files`) que l'agent a créée.

alter table public.producers enable row level security;

create policy "Agents can read their assigned producers"
on public.producers for select
using (
  exists (
    select 1
    from public.farm_files ff
    where
      ff.responsible_producer_id = id and
      ff.created_by = auth.uid()
  )
);
