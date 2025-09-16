-- Campaigns RPCs: resolve targets and process campaigns

-- Resolve targets based on campaign.target_filters JSON (coop/region/season/crop/severity)
create or replace function public.resolve_campaign_targets(p_campaign_id uuid)
returns table (
  producer_id uuid,
  profile_id uuid,
  phone text,
  push_token text
) language plpgsql security definer as $$
declare
  v_filters jsonb;
begin
  select target_filters into v_filters from public.campaigns where id = p_campaign_id;
  if v_filters is null then
    v_filters := '{}'::jsonb;
  end if;

  return query
  with base as (
    select pr.id as producer_id,
           pr.phone as phone,
           pr.profile_id as profile_id
    from public.producers pr
    -- basic filters by region/department/commune if provided
    where (not v_filters ? 'region' or pr.region = (v_filters->>'region'))
      and (not v_filters ? 'department' or pr.department = (v_filters->>'department'))
      and (not v_filters ? 'commune' or pr.commune = (v_filters->>'commune'))
  ),
  push as (
    select b.producer_id,
           b.profile_id,
           b.phone,
           null::text as push_token
    from base b
  )
  select p.producer_id, p.profile_id, p.phone, p.push_token from push p;
end;
$$;

revoke all on function public.resolve_campaign_targets(uuid) from public;
grant execute on function public.resolve_campaign_targets(uuid) to authenticated;

-- Process campaigns: scheduled -> running, instantiate recipients, recommendations, notifications
create or replace function public.process_campaigns()
returns void language plpgsql security definer as $$
declare
  r record;
begin
  for r in (
    select * from public.campaigns c
    where c.status = 'scheduled' and (c.schedule_at is null or c.schedule_at <= now())
    order by c.schedule_at nulls first
  ) loop
    -- mark running
    update public.campaigns set status = 'running' where id = r.id;

    -- resolve targets
    insert into public.campaign_recipients (campaign_id, profile_id, producer_id, phone, push_token)
    select r.id, t.profile_id, t.producer_id, t.phone, t.push_token
    from public.resolve_campaign_targets(r.id) t
    on conflict do nothing;

    -- create notifications for each recipient (body resolved from template as-is for MVP)
    insert into public.notifications (profile_id, title, body, channel, status, sent_at, metadata, created_at, updated_at, provider, delivered_at)
    select cr.profile_id,
           r.title,
           r.message_template,
           r.channel,
           'pending',
           null,
           jsonb_build_object('campaign_id', r.id, 'producer_id', cr.producer_id),
           now(), now(), null, null
    from public.campaign_recipients cr
    where cr.campaign_id = r.id
      and cr.status = 'pending';

    -- create recommendations rows (optional, ties to producer if present)
    insert into public.recommendations (title, message, status, producer_id, sent_at, rule_code, recommendation_type, created_at, updated_at, campaign_id)
    select r.title, r.message_template, 'pending', cr.producer_id, null, null, 'campaign', now(), now(), r.id
    from public.campaign_recipients cr
    where cr.campaign_id = r.id
      and cr.producer_id is not null;
  end loop;
end;
$$;

revoke all on function public.process_campaigns() from public;
grant execute on function public.process_campaigns() to authenticated;


