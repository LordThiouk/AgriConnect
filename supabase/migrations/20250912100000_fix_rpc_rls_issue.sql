-- Rétablit la fonction RPC `get_farm_files` pour qu'elle s'exécute avec les droits de l'appelant (agent).
-- Le `SECURITY DEFINER` est retiré et remplacé par `SECURITY INVOKER` (comportement par défaut)
-- La nouvelle politique RLS sur la table `producers` se chargera de la sécurité.

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
)
language plpgsql
security invoker -- ✅ Rétablit la sécurité standard, en s'appuyant sur RLS.
as $$
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
$$;
