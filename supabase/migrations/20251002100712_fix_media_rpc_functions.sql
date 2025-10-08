-- Migration: Correction des fonctions RPC pour la gestion des médias
-- Description: Corrige les problèmes d'agrégation et d'authentification
-- Date: 2025-01-02

-- 1. Corriger get_agent_media_stats (problème d'agrégation imbriquée)
CREATE OR REPLACE FUNCTION get_agent_media_stats(
    p_agent_id uuid
)
RETURNS TABLE (
    total_media bigint,
    media_by_type jsonb,
    total_size_bytes bigint,
    photos_with_gps bigint,
    recent_uploads bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_media bigint;
    v_media_by_type jsonb;
    v_total_size_bytes bigint;
    v_photos_with_gps bigint;
    v_recent_uploads bigint;
BEGIN
    -- Compter le total
    SELECT COUNT(*) INTO v_total_media
    FROM public.media
    WHERE owner_profile_id = p_agent_id;

    -- Compter par type
    SELECT jsonb_object_agg(entity_type, count) INTO v_media_by_type
    FROM (
        SELECT entity_type, COUNT(*) as count
        FROM public.media
        WHERE owner_profile_id = p_agent_id
        GROUP BY entity_type
    ) t;

    -- Taille totale
    SELECT COALESCE(SUM(file_size_bytes), 0) INTO v_total_size_bytes
    FROM public.media
    WHERE owner_profile_id = p_agent_id;

    -- Photos avec GPS
    SELECT COUNT(*) INTO v_photos_with_gps
    FROM public.media
    WHERE owner_profile_id = p_agent_id AND gps_coordinates IS NOT NULL;

    -- Uploads récents
    SELECT COUNT(*) INTO v_recent_uploads
    FROM public.media
    WHERE owner_profile_id = p_agent_id AND created_at >= now() - interval '7 days';

    RETURN QUERY
    SELECT 
        v_total_media,
        COALESCE(v_media_by_type, '{}'::jsonb),
        v_total_size_bytes,
        v_photos_with_gps,
        v_recent_uploads;
END;
$$;

-- 2. Corriger create_media (accepter owner_profile_id en paramètre)
CREATE OR REPLACE FUNCTION create_media(
    p_entity_type text,
    p_entity_id uuid,
    p_file_path text,
    p_file_name text,
    p_mime_type text,
    p_owner_profile_id uuid DEFAULT NULL,
    p_file_size_bytes bigint DEFAULT NULL,
    p_gps_lat numeric DEFAULT NULL,
    p_gps_lon numeric DEFAULT NULL,
    p_taken_at timestamptz DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_tags text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_media_id uuid;
    v_owner_id uuid;
BEGIN
    -- Utiliser l'ID fourni ou auth.uid() si disponible
    v_owner_id := COALESCE(p_owner_profile_id, auth.uid());
    
    -- Vérifier qu'on a un owner_id valide
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Owner profile ID is required';
    END IF;

    -- Insérer le média
    INSERT INTO public.media (
        owner_profile_id,
        entity_type,
        entity_id,
        file_path,
        file_name,
        mime_type,
        file_size_bytes,
        gps_coordinates,
        taken_at,
        description,
        tags
    ) VALUES (
        v_owner_id,
        p_entity_type,
        p_entity_id,
        p_file_path,
        p_file_name,
        p_mime_type,
        p_file_size_bytes,
        CASE 
            WHEN p_gps_lat IS NOT NULL AND p_gps_lon IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint(p_gps_lon, p_gps_lat), 4326)
            ELSE NULL
        END,
        COALESCE(p_taken_at, now()),
        p_description,
        p_tags
    ) RETURNING id INTO v_media_id;

    RETURN v_media_id;
END;
$$;

-- Commentaires mis à jour
COMMENT ON FUNCTION get_agent_media_stats(uuid) IS 'Recupere les statistiques des medias d un agent (corrige)';
COMMENT ON FUNCTION create_media(text, uuid, text, text, text, uuid, bigint, numeric, numeric, timestamptz, text, text[]) IS 'Cree un enregistrement media avec owner_profile_id optionnel (corrige)';
