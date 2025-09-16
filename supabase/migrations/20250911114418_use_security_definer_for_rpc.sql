-- Rétablit la fonction RPC `get_farm_files` pour qu'elle utilise SECURITY DEFINER.
-- C'est une approche de sécurité robuste qui a prouvé qu'elle fonctionnait pendant les tests,
-- en s'assurant que la fonction a les droits de lire les noms des producteurs tout en
-- filtrant les fiches pour l'agent spécifié.

DROP FUNCTION IF EXISTS public.get_farm_files(uuid);

CREATE OR REPLACE FUNCTION public.get_farm_files(p_agent_id uuid)
RETURNS TABLE(
    id uuid,
    farm_file_name text,
    producer_name text,
    location text,
    plot_count bigint,
    completion_percent numeric,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ff.id,
        ff.name AS farm_file_name,
        COALESCE(p.first_name || ' ' || p.last_name, 'Non assigné') AS producer_name,
        COALESCE(ff.village || ', ' || ff.commune, 'N/A') AS location,
        (SELECT COUNT(*) FROM public.plots pl WHERE pl.producer_id = ff.responsible_producer_id) AS plot_count,
        CASE
            WHEN ff.status = 'completed' THEN 100
            ELSE LEAST(
                (
                    (CASE WHEN ff.name IS NOT NULL AND ff.name <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.department IS NOT NULL AND ff.department <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.commune IS NOT NULL AND ff.commune <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.village IS NOT NULL AND ff.village <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.cooperative_id IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.census_date IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN p.first_name IS NOT NULL AND p.first_name <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN p.last_name IS NOT NULL AND p.last_name <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN p.birth_date IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN p.gender IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN ff.material_inventory IS NOT NULL AND ff.material_inventory::text <> '{}'::text THEN 1 ELSE 0 END) +
                    (CASE WHEN (SELECT COUNT(*) FROM public.plots pl WHERE pl.producer_id = ff.responsible_producer_id) > 0 THEN 5 ELSE 0 END)
                ) * 100 / 16
            , 99)::numeric
        END AS completion_percent,
        ff.status
    FROM
        public.farm_files ff
    LEFT JOIN
        public.producers p ON ff.responsible_producer_id = p.id
    WHERE
        ff.created_by = p_agent_id;
END;
$function$;
