create or replace function public.test_fiche_integrity(p_farm_file_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    report jsonb;
    farm_file_record record;
    producer_record record;
    agent_record record;
    seasonal_plot_count int;
    valid_seasonal_plot_count int;
    orphan_seasonal_plot_count int;
    crop_count int;
    valid_crop_count int;
    error_messages text[] := array[]::text[];
begin
    -- Check 1: Fiche existence
    select * into farm_file_record from public.farm_files where id = p_farm_file_id;
    if not found then
        return jsonb_build_object(
            'error', 'Fiche not found',
            'farm_file_id', p_farm_file_id,
            'checks_performed', 1
        );
    end if;

    -- Check 2: Producer link
    select * into producer_record from public.producers where id = farm_file_record.responsible_producer_id;
    if not found then
        error_messages := array_append(error_messages, 'Responsible producer link is broken.');
    end if;

    -- Check 3: Agent link
    select * into agent_record from public.profiles where id = farm_file_record.created_by and role = 'agent';
    if not found then
        error_messages := array_append(error_messages, 'Creating agent link is broken or user is not an agent.');
    end if;

    -- Check 4: Seasonal Plot integrity
    select count(*) into seasonal_plot_count from public.farm_file_plots where farm_file_id = p_farm_file_id;
    
    select count(*) into valid_seasonal_plot_count 
    from public.farm_file_plots ffp
    join public.plots p on ffp.plot_id = p.id
    where ffp.farm_file_id = p_farm_file_id;

    orphan_seasonal_plot_count := seasonal_plot_count - valid_seasonal_plot_count;
    if orphan_seasonal_plot_count > 0 then
        error_messages := array_append(error_messages, orphan_seasonal_plot_count || ' seasonal plots are orphaned (plot_id does not exist in plots table).');
    end if;
     if seasonal_plot_count = 0 then
        error_messages := array_append(error_messages, 'Fiche has no seasonal plots (farm_file_plots).');
    end if;

    -- Check 5: Crop integrity
    select count(*) into crop_count
    from public.crops c
    join public.farm_file_plots ffp on c.farm_file_plot_id = ffp.id
    where ffp.farm_file_id = p_farm_file_id;

    select count(*) into valid_crop_count
    from public.crops c
    join public.farm_file_plots ffp on c.farm_file_plot_id = ffp.id
    where ffp.farm_file_id = p_farm_file_id and c.plot_id = ffp.plot_id;

    if crop_count <> valid_crop_count then
         error_messages := array_append(error_messages, (crop_count - valid_crop_count) || ' crops have inconsistent plot_id links.');
    end if;

    -- Build the final report
    report := jsonb_build_object(
        'farm_file_id', p_farm_file_id,
        'status', case when array_length(error_messages, 1) > 0 then 'FAILED' else 'OK' end,
        'errors', to_jsonb(error_messages),
        'details', jsonb_build_object(
            'fiche_name', farm_file_record.name,
            'producer_found', producer_record is not null,
            'agent_found', agent_record is not null,
            'seasonal_plots_total', seasonal_plot_count,
            'seasonal_plots_valid', valid_seasonal_plot_count,
            'seasonal_plots_orphaned', orphan_seasonal_plot_count,
            'total_crops_found', crop_count,
            'validly_linked_crops', valid_crop_count
        )
    );

    return report;
end;
$$;
