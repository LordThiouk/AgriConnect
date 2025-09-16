-- Ajoute une politique RLS pour permettre aux agents de ne voir que leurs propres fiches.

alter table public.farm_files enable row level security;

-- Supprime l'ancienne politique si elle existe pour éviter les conflits
drop policy if exists "Agents can view their own farm files" on public.farm_files;

create policy "Agents can view their own farm files"
on public.farm_files for select
using (
  auth.uid() = created_by
);
