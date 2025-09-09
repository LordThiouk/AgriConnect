-- Agent Entities: farm_files, participants, inputs + helper trigger

-- Helper trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  if new.updated_at is distinct from now() then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- farm_files
create table if not exists public.farm_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  department text not null,
  commune text not null,
  village text not null,
  sector text not null,
  cooperative_id uuid not null references public.cooperatives(id) on delete restrict,
  gpc text,
  census_date date not null,
  responsible_producer_id uuid references public.producers(id) on delete set null,
  material_inventory jsonb default '{}'::jsonb not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','validated'))
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_farm_files') then
    create trigger set_timestamp_farm_files
      before update on public.farm_files
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_farm_files_coop on public.farm_files(cooperative_id);
create index if not exists idx_farm_files_created_by on public.farm_files(created_by);

alter table public.farm_files enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'farm_files' and policyname = 'farm_files_select_owner_admin'
  ) then
    create policy farm_files_select_owner_admin on public.farm_files
    for select using (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'farm_files' and policyname = 'farm_files_insert_owner'
  ) then
    create policy farm_files_insert_owner on public.farm_files
    for insert with check (created_by = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'farm_files' and policyname = 'farm_files_update_owner_admin'
  ) then
    create policy farm_files_update_owner_admin on public.farm_files
    for update using (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    ) with check (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

-- participants
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots(id) on delete cascade,
  name text not null,
  role text not null,
  sex text check (sex in ('M','F')),
  birthdate date,
  cni text,
  literacy boolean,
  languages text[] default '{}',
  is_young boolean,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_participants') then
    create trigger set_timestamp_participants
      before update on public.participants
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_participants_plot on public.participants(plot_id);
create index if not exists idx_participants_created_by on public.participants(created_by);

alter table public.participants enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'participants' and policyname = 'participants_select_owner_admin'
  ) then
    create policy participants_select_owner_admin on public.participants
    for select using (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'participants' and policyname = 'participants_insupd_owner'
  ) then
    create policy participants_insupd_owner on public.participants
    for all using (created_by = auth.uid()) with check (created_by = auth.uid());
  end if;
end $$;

-- inputs
create table if not exists public.inputs (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references public.plots(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete cascade,
  category text not null,
  label text,
  quantity numeric,
  unit text,
  planned boolean,
  cost_fcfa numeric,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plot_id is not null or crop_id is not null)
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_inputs') then
    create trigger set_timestamp_inputs
      before update on public.inputs
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_inputs_plot on public.inputs(plot_id);
create index if not exists idx_inputs_crop on public.inputs(crop_id);
create index if not exists idx_inputs_created_by on public.inputs(created_by);

alter table public.inputs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inputs' and policyname = 'inputs_select_owner_admin'
  ) then
    create policy inputs_select_owner_admin on public.inputs
    for select using (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inputs' and policyname = 'inputs_insupd_owner'
  ) then
    create policy inputs_insupd_owner on public.inputs
    for all using (created_by = auth.uid()) with check (created_by = auth.uid());
  end if;
end $$;


