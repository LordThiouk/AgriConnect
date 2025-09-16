create or replace function public.delete_crops_for_farm_file(p_farm_file_id uuid)
returns void
language plpgsql
as $$
begin
  delete from public.crops c
  where c.plot_id in (
    select p.id
    from public.plots p
    where p.farm_file_id = p_farm_file_id
  );
end;
$$;
