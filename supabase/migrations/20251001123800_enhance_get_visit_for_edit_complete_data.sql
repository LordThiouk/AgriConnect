-- ============================================================================
-- ENHANCE: Améliorer get_visit_for_edit avec toutes les données nécessaires
-- ============================================================================
-- Description: Récupérer tous les détails de la visite pour l'édition
-- Inclut: type de visite, notes, durée, localisation, superficie, etc.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_visit_for_edit(p_visit_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Récupérer la visite avec toutes les données nécessaires
    SELECT json_build_object(
        'visit', json_build_object(
            'id', v.id,
            'producer_id', v.producer_id,
            'plot_id', v.plot_id,
            'agent_id', v.agent_id,
            'cooperative_id', v.cooperative_id,
            'visit_date', v.visit_date,
            'visit_type', v.visit_type,
            'status', v.status,
            'duration_minutes', v.duration_minutes,
            'location_latitude', v.location_latitude,
            'location_longitude', v.location_longitude,
            'notes', v.notes,
            'weather_conditions', v.weather_conditions,
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
            'name', pl.name_season_snapshot,
            'area_hectares', pl.area_hectares,
            'soil_type', pl.soil_type,
            'water_source', pl.water_source,
            'center_point', pl.center_point,
            'geom', pl.geom,
            'status', pl.status,
            'notes', pl.notes,
            'created_at', pl.created_at,
            'updated_at', pl.updated_at
        ),
        'agent', json_build_object(
            'id', NULL,
            'user_id', v.agent_id,
            'phone', NULL,
            'display_name', 'Agent ' || SUBSTRING(v.agent_id::text, 1, 8)
        ),
        'cooperative', CASE 
            WHEN c.id IS NOT NULL THEN json_build_object(
                'id', c.id,
                'name', c.name,
                'region', c.region,
                'department', c.department,
                'commune', c.commune
            )
            ELSE NULL
        END
    ) INTO result
    FROM visits v
    LEFT JOIN producers p ON p.id = v.producer_id
    LEFT JOIN plots pl ON pl.id = v.plot_id
    LEFT JOIN cooperatives c ON c.id = v.cooperative_id
    WHERE v.id = p_visit_id;

    -- Vérifier que la visite existe
    IF result IS NULL THEN
        RAISE EXCEPTION 'Visit % not found', p_visit_id;
    END IF;

    RETURN result;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION get_visit_for_edit(UUID) IS 'Récupère une visite complète avec toutes les données pour modification (producteur, parcelle, agent, coopérative)';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      GET_VISIT_FOR_EDIT AMÉLIORÉ                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles donnees incluses:';
  RAISE NOTICE '  ✓ Type de visite (visit_type)';
  RAISE NOTICE '  ✓ Conditions meteo (weather_conditions)';
  RAISE NOTICE '  ✓ Localisation GPS (latitude/longitude)';
  RAISE NOTICE '  ✓ Superficie parcelle (area_hectares)';
  RAISE NOTICE '  ✓ Localisation parcelle (center_point, geom)';
  RAISE NOTICE '  ✓ Informations cooperative';
  RAISE NOTICE '  ✓ Tous les champs de la visite';
  RAISE NOTICE '';
  RAISE NOTICE 'Resultat: Donnees completes pour edition de visite';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
