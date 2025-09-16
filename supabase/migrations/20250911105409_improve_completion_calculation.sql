-- Améliore la logique de calcul du pourcentage de complétion dans la fonction RPC `get_farm_files`.
--
-- Changements :
-- 1. Si le statut est 'completed', le pourcentage est de 100%.
-- 2. Pour les brouillons ('draft'), le calcul se base sur un plus grand nombre de champs pertinents
--    issus de `farm_files` et `producers`.
-- 3. L'ajout d'au moins une parcelle a un poids significatif dans le calcul.
-- 4. Le pourcentage d'un brouillon est plafonné à 99% pour éviter toute confusion.
-- 5. La jointure pour le comptage des parcelles est corrigée pour utiliser `farm_file_id`.

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
SECURITY INVOKER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ff.id,
        ff.name AS farm_file_name,
        COALESCE(p.first_name || ' ' || p.last_name, 'Non assigné') AS producer_name,
        COALESCE(ff.village || ', ' || ff.commune, 'N/A') AS location,
        (SELECT COUNT(*) FROM public.plots pl WHERE pl.farm_file_id = ff.id) AS plot_count,
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
                    -- Producer info
                    (CASE WHEN p.first_name IS NOT NULL AND p.first_name <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN p.last_name IS NOT NULL AND p.last_name <> '' THEN 1 ELSE 0 END) +
                    (CASE WHEN p.birth_date IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN p.gender IS NOT NULL THEN 1 ELSE 0 END) +
                    -- Material inventory check (1 point)
                    (CASE WHEN ff.material_inventory IS NOT NULL AND ff.material_inventory::text <> '{}'::text THEN 1 ELSE 0 END) +
                    -- Parcel check (5 points)
                    (CASE WHEN (SELECT COUNT(*) FROM public.plots pl WHERE pl.farm_file_id = ff.id) > 0 THEN 5 ELSE 0 END)
                ) * 100 / 16 -- 11 checks (1 point each) + 5 points for parcels = 16 points total
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
