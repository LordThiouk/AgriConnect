-- Migration: Créer RPC get_visit_for_edit
-- Description: RPC pour récupérer une visite avec toutes les données nécessaires pour modification
-- Date: 2025-01-01

-- RPC pour récupérer une visite avec producteur et parcelle pour modification
CREATE OR REPLACE FUNCTION get_visit_for_edit(p_visit_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Vérifier que l'utilisateur a accès à cette visite
    IF NOT EXISTS (
        SELECT 1 FROM visits v
        JOIN agent_assignments aa ON aa.assigned_to_id = v.producer_id
        WHERE v.id = p_visit_id 
        AND aa.agent_id = auth.uid()
        AND aa.assigned_to_type = 'producer'
    ) THEN
        -- Vérifier si c'est un superviseur/admin
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('supervisor', 'admin')
        ) THEN
            RAISE EXCEPTION 'Access denied to visit %', p_visit_id;
        END IF;
    END IF;

    -- Récupérer la visite avec producteur et parcelle
    SELECT json_build_object(
        'visit', json_build_object(
            'id', v.id,
            'producer_id', v.producer_id,
            'plot_id', v.plot_id,
            'agent_id', v.agent_id,
            'visit_date', v.visit_date,
            'status', v.status,
            'notes', v.notes,
            'duration_minutes', v.duration_minutes,
            'created_at', v.created_at,
            'updated_at', v.updated_at
        ),
        'producer', json_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'phone', p.phone,
            'village', p.village,
            'commune', p.commune,
            'region', p.region
        ),
        'plot', json_build_object(
            'id', pl.id,
            'name', pl.name,
            'area_hectares', pl.area_hectares,
            'soil_type', pl.soil_type,
            'water_source', pl.water_source,
            'location', pl.location,
            'coordinates', pl.coordinates
        ),
        'agent', json_build_object(
            'id', ag.id,
            'user_id', ag.user_id,
            'phone', ag.phone,
            'display_name', ag.display_name
        )
    ) INTO result
    FROM visits v
    LEFT JOIN producers p ON p.id = v.producer_id
    LEFT JOIN plots pl ON pl.id = v.plot_id
    LEFT JOIN profiles ag ON ag.user_id = v.agent_id
    WHERE v.id = p_visit_id;

    -- Vérifier que la visite existe
    IF result IS NULL THEN
        RAISE EXCEPTION 'Visit % not found', p_visit_id;
    END IF;

    RETURN result;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION get_visit_for_edit(UUID) IS 'Récupère une visite avec producteur et parcelle pour modification';
