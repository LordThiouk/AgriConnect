-- RPC to create a producer with SECURITY DEFINER to bypass RLS for permitted roles

create or replace function public.create_producer_for_agent(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_birth_date date,
  p_gender text,
  p_cooperative_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role text;
begin
  -- minimal role check
  select role into v_role from public.profiles where user_id = auth.uid();
  if v_role not in ('agent','admin','supervisor','coop_admin') then
    raise exception 'Not allowed';
  end if;

  insert into public.producers (first_name, last_name, phone, birth_date, gender, cooperative_id)
  values (p_first_name, p_last_name, nullif(p_phone,''), p_birth_date, p_gender, p_cooperative_id)
  returning id into v_id;

  return v_id;
end;
$$;


