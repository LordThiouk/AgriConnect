-- Migration: Création du RPC get_agent_plots_with_geolocation
-- Description: Récupère toutes les parcelles des producteurs assignés à un agent avec géolocalisation

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS get_agent_plots_with_geolocation(uuid);

CREATE OR REPLACE FUNCTION get_agent_plots_with_geolocation(p_agent_user_id uuid)
RETURNS TABLE (
    id uuid,
    producer_id uuid,
    producer_name text,
    cooperative_id uuid,
    cooperative_name text,
    name_season_snapshot text,
    area_hectares numeric,
    soil_type text,
    soil_ph numeric,
    water_source text,
    irrigation_type text,
    slope_percent integer,
    elevation_meters integer,
    geom jsonb,
    center_point jsonb,
    status text,
    notes text,
    created_at timestamptz,
    updated_at timestamptz,
    farm_file_id uuid,
    typology text,
    producer_size text,
    cotton_variety text,
    has_gps boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_profile_id UUID;
    v_producer_ids UUID[];
BEGIN
    -- Récupérer l'ID du profil agent
    SELECT profiles.id INTO v_agent_profile_id
    FROM public.profiles
    WHERE profiles.user_id = p_agent_user_id AND profiles.role = 'agent';

    IF v_agent_profile_id IS NULL THEN
        RAISE NOTICE 'Agent non trouvé pour user_id: %', p_agent_user_id;
        RETURN;
    END IF;

    -- Récupérer les IDs des producteurs assignés à cet agent
    SELECT array_agg(agent_assignments.assigned_to_id)
    INTO v_producer_ids
    FROM public.agent_assignments
    WHERE agent_assignments.agent_id = v_agent_profile_id
      AND agent_assignments.assigned_to_type = 'producer';

    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RAISE NOTICE 'Aucun producteur assigné à l''agent: %', v_agent_profile_id;
        RETURN;
    END IF;

    -- Retourner les parcelles avec géolocalisation
    RETURN QUERY
    SELECT 
        p.id,
        p.producer_id,
        CONCAT(pr.first_name, ' ', pr.last_name) as producer_name,
        p.cooperative_id,
        c.name as cooperative_name,
        p.name_season_snapshot,
        p.area_hectares,
        p.soil_type,
        p.soil_ph,
        p.water_source,
        p.irrigation_type,
        p.slope_percent,
        p.elevation_meters,
        ST_AsGeoJSON(p.geom)::jsonb as geom,
        ST_AsGeoJSON(p.center_point)::jsonb as center_point,
        p.status,
        p.notes,
        p.created_at,
        p.updated_at,
        p.farm_file_id,
        p.typology,
        p.producer_size,
        p.cotton_variety,
        CASE 
            WHEN p.geom IS NOT NULL AND ST_IsValid(p.geom) THEN true
            ELSE false
        END as has_gps
    FROM public.plots p
    JOIN public.producers pr ON p.producer_id = pr.id
    LEFT JOIN public.cooperatives c ON p.cooperative_id = c.id
    WHERE p.producer_id = ANY(v_producer_ids)
      AND p.status = 'active'
    ORDER BY p.created_at DESC;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_agent_plots_with_geolocation(uuid) IS 
'Récupère toutes les parcelles des producteurs assignés à un agent avec informations de géolocalisation';

-- Test de la fonction
DO $$
DECLARE
    test_agent_id UUID;
    plot_count INTEGER;
BEGIN
    -- Récupérer un agent de test
    SELECT profiles.user_id INTO test_agent_id
    FROM public.profiles
    WHERE profiles.role = 'agent'
    LIMIT 1;
    
    IF test_agent_id IS NOT NULL THEN
        -- Compter les parcelles retournées
        SELECT COUNT(*) INTO plot_count
        FROM get_agent_plots_with_geolocation(test_agent_id);
        
        RAISE NOTICE 'Test get_agent_plots_with_geolocation: % parcelles trouvées pour agent %', 
                     plot_count, test_agent_id;
    ELSE
        RAISE NOTICE 'Aucun agent trouvé pour le test';
    END IF;
END;
$$;
