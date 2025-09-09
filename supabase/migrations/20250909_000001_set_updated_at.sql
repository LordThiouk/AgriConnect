-- Ensure updated_at trigger function exists early in migration order
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at is distinct from now() then
    new.updated_at = now();
  end if;
  return new;
end;
$$;


