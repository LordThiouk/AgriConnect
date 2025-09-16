-- Corrige la logique de la fonction RPC `get_farm_files` pour utiliser la bonne jointure.
-- La table `plots` est liée via `producer_id`, et non `farm_file_id`.

-- Supprime l'ancienne version de la fonction pour garantir une recréation propre.
DROP FUNCTION IF EXISTS public.get_farm_files(uuid);

create or replace function get_farm_files(p_agent_id uuid)
returns table (
    id uuid,
    farm_file_name text,
    producer_name text,
    location text,
    plot_count bigint,
    completion_percent numeric,
    status text
) as $$
begin
    return query
    select
        ff.id,
        ff.name as farm_file_name,
        coalesce(
            p.first_name || ' ' || p.last_name,
            'Non assigné'
        ) as producer_name,
        coalesce(ff.village || ', ' || ff.commune, 'N/A') as location,
        (
            -- Correction : Lier les parcelles via le producteur responsable
            select count(*)
            from public.plots pl
            where pl.producer_id = ff.responsible_producer_id
        ) as plot_count,
        (
            (
                (case when ff.name is not null then 1 else 0 end) +
                (case when ff.village is not null then 1 else 0 end) +
                (case when ff.responsible_producer_id is not null then 1 else 0 end)
            ) * 100 / 3
        )::numeric as completion_percent,
        ff.status
    from
        public.farm_files ff
        left join public.producers p on ff.responsible_producer_id = p.id
    where
        ff.created_by = p_agent_id;
end;
$$ language plpgsql;
