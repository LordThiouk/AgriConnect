-- Campaigns initial schema: tables, links, indexes, RLS

-- Ensure helper trigger function exists (reused)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  if new.updated_at is distinct from now() then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- campaigns table
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  channel text not null check (channel in ('sms','push','whatsapp','inapp')),
  message_template text not null,
  locale text not null default 'fr',
  target_filters jsonb not null default '{}'::jsonb,
  schedule_at timestamptz,
  status text not null default 'draft' check (status in ('draft','scheduled','running','completed','cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_campaigns') then
    create trigger set_timestamp_campaigns
      before update on public.campaigns
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_schedule on public.campaigns(schedule_at);
create index if not exists idx_campaigns_created_by on public.campaigns(created_by);

alter table public.campaigns enable row level security;

-- RLS policies for campaigns
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'campaigns' and policyname = 'campaigns_select_owner_admin'
  ) then
    create policy campaigns_select_owner_admin on public.campaigns
    for select using (
      created_by = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'campaigns' and policyname = 'campaigns_insert_admin'
  ) then
    create policy campaigns_insert_admin on public.campaigns
    for insert with check (
      exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      ) and created_by = auth.uid()
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'campaigns' and policyname = 'campaigns_update_admin_owner'
  ) then
    create policy campaigns_update_admin_owner on public.campaigns
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

-- campaign_recipients table
create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  producer_id uuid references public.producers(id) on delete set null,
  phone text,
  push_token text,
  status text not null default 'pending' check (status in ('pending','sent','failed','ack')),
  sent_at timestamptz,
  ack_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_campaign_recipients') then
    create trigger set_timestamp_campaign_recipients
      before update on public.campaign_recipients
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_campaign_recipients_campaign on public.campaign_recipients(campaign_id);
create index if not exists idx_campaign_recipients_status on public.campaign_recipients(status);

alter table public.campaign_recipients enable row level security;

-- RLS policies for campaign_recipients (tie to campaign created_by or admin/supervisor)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'campaign_recipients' and policyname = 'campaign_recipients_select_scope'
  ) then
    create policy campaign_recipients_select_scope on public.campaign_recipients
    for select using (
      exists (
        select 1 from public.campaigns c
        where c.id = campaign_id
          and (c.created_by = auth.uid() or exists (
            select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
          ))
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'campaign_recipients' and policyname = 'campaign_recipients_modify_admin'
  ) then
    create policy campaign_recipients_modify_admin on public.campaign_recipients
    for all using (
      exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    ) with check (
      exists (
        select 1 from public.profiles p where p.id = auth.uid() and (p.role::text = 'admin' or p.role::text = 'supervisor')
      )
    );
  end if;
end $$;

-- Optional links from recommendations/notifications to campaigns
do $$ begin
  if not exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'recommendations' and column_name = 'campaign_id'
  ) then
    alter table public.recommendations add column campaign_id uuid references public.campaigns(id) on delete set null;
    create index if not exists idx_recommendations_campaign on public.recommendations(campaign_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'campaign_id'
  ) then
    alter table public.notifications add column campaign_id uuid references public.campaigns(id) on delete set null;
    create index if not exists idx_notifications_campaign on public.notifications(campaign_id);
  end if;
end $$;


