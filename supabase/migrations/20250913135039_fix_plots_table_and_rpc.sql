-- =============================================
-- 1. Helper Functions
-- =============================================

-- Helper function to get the role of the current user
create or replace function public.get_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid();
$$;

-- Helper function to check if the user is an admin or supervisor
create or replace function public.is_admin_or_supervisor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select get_user_role() in ('admin', 'supervisor');
$$;


-- =============================================
-- 2. Schema Changes for 'plots' table
-- =============================================

-- Add cooperative_id and created_by columns to the plots table
alter table public.plots
add column if not exists cooperative_id uuid references public.cooperatives(id),
add column if not exists created_by uuid references auth.users(id) default auth.uid();


-- =============================================
-- 3. RLS Policies for 'plots' table
-- =============================================

-- Drop existing policies to avoid conflicts
drop policy if exists "Allow agent to insert their own plots" on public.plots;
drop policy if exists "Allow agent to view plots from their cooperative" on public.plots;
drop policy if exists "Allow admin/supervisor full access to plots" on public.plots;

-- Allow agents to insert plots if they belong to the correct cooperative
create policy "Allow agent to insert their own plots"
on public.plots for insert
with check (
  (get_user_role() = 'agent') AND
  (cooperative_id IN (
    select cooperative_id from profiles where user_id = auth.uid()
  ))
);

-- Allow agents to view plots from their cooperative
create policy "Allow agent to view plots from their cooperative"
on public.plots for select
using (
  (get_user_role() = 'agent') AND
  (cooperative_id IN (
    select cooperative_id from profiles where user_id = auth.uid()
  ))
);

-- Allow admin/supervisor full access to plots
create policy "Allow admin/supervisor full access to plots"
on public.plots for all
using (
  is_admin_or_supervisor()
);


-- =============================================
-- 4. RPC Function to Create a Plot
-- =============================================

create or replace function public.create_plot_for_agent(
    plot_name text,
    p_producer_id uuid,
    p_cooperative_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
    new_plot_id uuid;
begin
    -- This function runs with elevated privileges (security definer),
    -- so we MUST validate the calling user's permissions manually.

    -- Check 1: Ensure the caller is an agent and belongs to the target cooperative.
    if not exists (
        select 1
        from public.profiles
        where user_id = auth.uid()
          and cooperative_id = p_cooperative_id
          and role = 'agent'
    ) then
        raise exception 'Security check failed: Agent not authorized for this cooperative.';
    end if;

    -- Check 2: Insert the plot referential, setting the creator to the calling user.
    -- Area is seasonal and will be stored in farm_file_plots, not here.
    insert into public.plots (name, producer_id, cooperative_id, created_by)
    values (plot_name, p_producer_id, p_cooperative_id, auth.uid())
    returning id into new_plot_id;

    return new_plot_id;
end;
$$;
