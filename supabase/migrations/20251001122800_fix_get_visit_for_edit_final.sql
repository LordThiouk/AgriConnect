-- Migration: Correction finale de get_visit_for_edit
-- Description: Utiliser les vraies colonnes de la table producers
-- Date: 2025-01-01

-- RPC final avec les bonnes colonnes
CREATE OR REPLACE FUNCTION get_visit_for_edit(p_visit_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
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
            'profile_id', p.profile_id,
            'cooperative_id', p.cooperative_id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'phone', p.phone,
            'email', p.email,
            'village', p.village,
            'commune', p.commune,
            'department', p.department,
            'region', p.region,
            'address', p.address
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
            'id', NULL,
            'user_id', v.agent_id,
            'phone', NULL,
            'display_name', 'Agent ' || SUBSTRING(v.agent_id::text, 1, 8)
        )
    ) INTO result
    FROM visits v
    LEFT JOIN producers p ON p.id = v.producer_id
    LEFT JOIN plots pl ON pl.id = v.plot_id
    WHERE v.id = p_visit_id;

    -- Vérifier que la visite existe
    IF result IS NULL THEN
        RAISE EXCEPTION 'Visit % not found', p_visit_id;
    END IF;

    RETURN result;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION get_visit_for_edit(UUID) IS 'Récupère une visite avec producteur et parcelle pour modification (colonnes finales)';
