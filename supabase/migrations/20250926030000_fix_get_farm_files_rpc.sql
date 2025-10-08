-- Migration: Correction de la fonction RPC get_farm_files pour identifier correctement l'agent
-- Date: 2025-01-26
-- Description: La fonction doit utiliser le profile.id (created_by) au lieu de user_id
-- car les fiches sont créées avec l'ID du profil agent, pas l'ID utilisateur

DROP FUNCTION IF EXISTS public.get_farm_files(uuid);

CREATE OR REPLACE FUNCTION get_farm_files(p_agent_user_id UUID)
RETURNS TABLE (
    id UUID,
    farm_file_name TEXT,
    producer_name TEXT,
    location TEXT,
    plot_count BIGINT,
    completion_percent NUMERIC,
    status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ff.id,
        ff.name as farm_file_name,
        COALESCE(
            p.first_name || ' ' || p.last_name,
            'Non assigné'
        ) as producer_name,
        COALESCE(ff.village || ', ' || ff.commune, 'N/A') as location,
        (
            -- Compter les parcelles liées via farm_file_plots
            SELECT COUNT(*)
            FROM public.farm_file_plots ffp
            WHERE ffp.farm_file_id = ff.id
        ) as plot_count,
        (
            (
                (CASE WHEN ff.name IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN ff.village IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN ff.responsible_producer_id IS NOT NULL THEN 1 ELSE 0 END)
            ) * 100 / 3
        )::numeric as completion_percent,
        ff.status
    FROM
        public.farm_files ff
        LEFT JOIN public.producers p ON ff.responsible_producer_id = p.id
        INNER JOIN public.profiles prof ON prof.id = ff.created_by
    WHERE
        prof.user_id = p_agent_user_id;
END;
$$;

-- Assurer que la fonction est accessible
GRANT EXECUTE ON FUNCTION public.get_farm_files(UUID) TO authenticated;
