-- 1. Create the function to link a producer to a profile
create or replace function public.link_producer_to_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if the new profile has a phone number
  if new.phone is not null then
    -- Find a producer with the same phone number who is not yet linked to a profile
    update public.producers
    set profile_id = new.id
    where phone = new.phone and profile_id is null;
  end if;
  return new;
end;
$$;

-- 2. Create the trigger to execute the function after a new user profile is created
create trigger on_new_profile_created
  after insert on public.profiles
  for each row
  execute function public.link_producer_to_profile();
