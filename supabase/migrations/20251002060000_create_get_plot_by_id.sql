-- Migration: Création du RPC get_plot_by_id
-- Description: Récupère les détails d'une parcelle par son ID avec toutes les informations

CREATE OR REPLACE FUNCTION get_plot_by_id(p_plot_id uuid)
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
BEGIN
    -- Vérifier que la parcelle existe
    IF NOT EXISTS (SELECT 1 FROM public.plots WHERE plots.id = p_plot_id) THEN
        RAISE NOTICE 'Parcelle non trouvée avec ID: %', p_plot_id;
        RETURN;
    END IF;

    -- Retourner les détails de la parcelle
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
    WHERE p.id = p_plot_id;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_plot_by_id(uuid) IS 
'Recupere les details complets d une parcelle par son ID avec informations de geolocalisation';

-- Test de la fonction
DO $$
DECLARE
    test_plot_id UUID;
    plot_count INTEGER;
BEGIN
    -- Récupérer une parcelle de test
    SELECT plots.id INTO test_plot_id
    FROM public.plots
    LIMIT 1;
    
    IF test_plot_id IS NOT NULL THEN
        -- Compter les parcelles retournées
        SELECT COUNT(*) INTO plot_count
        FROM get_plot_by_id(test_plot_id);
        
        RAISE NOTICE 'Test get_plot_by_id: % parcelles trouvées pour ID %', 
                     plot_count, test_plot_id;
    ELSE
        RAISE NOTICE 'Aucune parcelle trouvée pour le test';
    END IF;
END;
$$;
