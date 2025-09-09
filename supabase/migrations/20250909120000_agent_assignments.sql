-- Enforce producer cooperative relation and create agent-producer assignments

-- Ensure producers.coop_id exists and is not null, with FK
do $$ begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'producers' and column_name = 'coop_id'
  ) then
    alter table public.producers
      alter column coop_id set not null;
    -- add FK if missing
    begin
      alter table public.producers
        add constraint producers_coop_id_fkey foreign key (coop_id) references public.cooperatives(id) on delete restrict;
    exception when duplicate_object then null; end;
  end if;
end $$;

-- agent_producer_assignments table
create table if not exists public.agent_producer_assignments (
  agent_id uuid not null references public.profiles(id) on delete cascade,
  producer_id uuid not null references public.producers(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (agent_id, producer_id)
);

create index if not exists idx_apa_agent on public.agent_producer_assignments(agent_id);
create index if not exists idx_apa_producer on public.agent_producer_assignments(producer_id);

alter table public.agent_producer_assignments enable row level security;

-- Policies: agents see their own assignments; admins/supervisors see all
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_producer_assignments' and policyname = 'apa_select'
  ) then
    create policy apa_select on public.agent_producer_assignments
    for select using (
      agent_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_producer_assignments' and policyname = 'apa_insert'
  ) then
    create policy apa_insert on public.agent_producer_assignments
    for insert with check (
      agent_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_producer_assignments' and policyname = 'apa_update_delete'
  ) then
    create policy apa_update_delete on public.agent_producer_assignments
    for update using (
      agent_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    ) with check (
      agent_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;


