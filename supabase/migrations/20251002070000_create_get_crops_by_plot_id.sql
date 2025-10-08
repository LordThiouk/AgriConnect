-- Migration: Création du RPC get_crops_by_plot_id
-- Description: Récupère toutes les cultures d'une parcelle par son ID

CREATE OR REPLACE FUNCTION get_crops_by_plot_id(p_plot_id uuid)
RETURNS TABLE (
    id uuid,
    plot_id uuid,
    crop_type text,
    variety text,
    sowing_date date,
    expected_harvest_date date,
    actual_harvest_date date,
    expected_yield_kg numeric,
    actual_yield_kg numeric,
    area_hectares numeric,
    status text,
    notes text,
    created_at timestamptz,
    updated_at timestamptz
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

    -- Retourner les cultures de la parcelle
    RETURN QUERY
    SELECT 
        c.id,
        c.plot_id,
        c.crop_type,
        c.variety,
        c.sowing_date,
        c.expected_harvest_date,
        c.actual_harvest_date,
        c.expected_yield_kg,
        c.actual_yield_kg,
        c.area_hectares,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at
    FROM public.crops c
    WHERE c.plot_id = p_plot_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_crops_by_plot_id(uuid) IS 
'Recupere toutes les cultures d une parcelle par son ID';

-- Test de la fonction
DO $$
DECLARE
    test_plot_id UUID;
    crop_count INTEGER;
BEGIN
    -- Récupérer une parcelle de test
    SELECT plots.id INTO test_plot_id
    FROM public.plots
    LIMIT 1;
    
    IF test_plot_id IS NOT NULL THEN
        -- Compter les cultures retournées
        SELECT COUNT(*) INTO crop_count
        FROM get_crops_by_plot_id(test_plot_id);
        
        RAISE NOTICE 'Test get_crops_by_plot_id: % cultures trouvées pour parcelle %', 
                     crop_count, test_plot_id;
    ELSE
        RAISE NOTICE 'Aucune parcelle trouvée pour le test';
    END IF;
END;
$$;
