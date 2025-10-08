-- Migration: Création des RPC pour la gestion des médias
-- Description: Fonctions pour upload, récupération et suppression des médias
-- Date: 2025-01-02

-- 1. RPC pour récupérer les médias d'une entité
CREATE OR REPLACE FUNCTION get_media_by_entity(
    p_entity_type text,
    p_entity_id uuid
)
RETURNS TABLE (
    id uuid,
    owner_profile_id uuid,
    entity_type text,
    entity_id uuid,
    file_path text,
    file_name text,
    mime_type text,
    file_size_bytes bigint,
    gps_coordinates geometry(point, 4326),
    taken_at timestamptz,
    description text,
    tags text[],
    created_at timestamptz,
    updated_at timestamptz,
    public_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.owner_profile_id,
        m.entity_type,
        m.entity_id,
        m.file_path,
        m.file_name,
        m.mime_type,
        m.file_size_bytes,
        m.gps_coordinates,
        m.taken_at,
        m.description,
        m.tags,
        m.created_at,
        m.updated_at,
        -- Générer l'URL publique
        'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/media/' || m.file_path as public_url
    FROM public.media m
    WHERE m.entity_type = p_entity_type
      AND m.entity_id = p_entity_id
    ORDER BY m.created_at DESC;
END;
$$;

-- 2. RPC pour récupérer les médias d'un agent
CREATE OR REPLACE FUNCTION get_agent_media(
    p_agent_id uuid,
    p_limit_count integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    owner_profile_id uuid,
    entity_type text,
    entity_id uuid,
    file_path text,
    file_name text,
    mime_type text,
    file_size_bytes bigint,
    gps_coordinates geometry(point, 4326),
    taken_at timestamptz,
    description text,
    tags text[],
    created_at timestamptz,
    updated_at timestamptz,
    public_url text,
    entity_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.owner_profile_id,
        m.entity_type,
        m.entity_id,
        m.file_path,
        m.file_name,
        m.mime_type,
        m.file_size_bytes,
        m.gps_coordinates,
        m.taken_at,
        m.description,
        m.tags,
        m.created_at,
        m.updated_at,
        -- Générer l'URL publique
        'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/media/' || m.file_path as public_url,
        -- Nom de l'entité selon le type
        CASE 
            WHEN m.entity_type = 'plot' THEN COALESCE(pl.name_season_snapshot, 'Parcelle')
            WHEN m.entity_type = 'producer' THEN COALESCE(pr.first_name || ' ' || pr.last_name, 'Producteur')
            WHEN m.entity_type = 'crop' THEN COALESCE(c.crop_type, 'Culture')
            WHEN m.entity_type = 'operation' THEN 'Opération'
            WHEN m.entity_type = 'observation' THEN 'Observation'
            ELSE 'Entité'
        END as entity_name
    FROM public.media m
    LEFT JOIN public.plots pl ON m.entity_type = 'plot' AND m.entity_id = pl.id
    LEFT JOIN public.producers pr ON m.entity_type = 'producer' AND m.entity_id = pr.id
    LEFT JOIN public.crops c ON m.entity_type = 'crop' AND m.entity_id = c.id
    WHERE m.owner_profile_id = p_agent_id
    ORDER BY m.created_at DESC
    LIMIT p_limit_count;
END;
$$;

-- 3. RPC pour supprimer un média
CREATE OR REPLACE FUNCTION delete_media(
    p_media_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_file_path text;
    v_owner_id uuid;
BEGIN
    -- Récupérer le chemin du fichier et le propriétaire
    SELECT file_path, owner_profile_id
    INTO v_file_path, v_owner_id
    FROM public.media
    WHERE id = p_media_id;

    -- Vérifier que le média existe
    IF v_file_path IS NULL THEN
        RAISE EXCEPTION 'Média non trouvé';
    END IF;

    -- Vérifier que l'utilisateur est le propriétaire
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Non autorisé à supprimer ce média';
    END IF;

    -- Supprimer l'enregistrement de la base
    DELETE FROM public.media WHERE id = p_media_id;

    -- Retourner le chemin pour suppression du fichier
    RETURN true;
END;
$$;

-- 4. RPC pour créer un média (après upload storage)
CREATE OR REPLACE FUNCTION create_media(
    p_entity_type text,
    p_entity_id uuid,
    p_file_path text,
    p_file_name text,
    p_mime_type text,
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
BEGIN
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
        auth.uid(),
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

-- 5. RPC pour récupérer les statistiques des médias d'un agent
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
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_media,
        jsonb_object_agg(
            entity_type, 
            COUNT(*)
        ) as media_by_type,
        COALESCE(SUM(file_size_bytes), 0) as total_size_bytes,
        COUNT(*) FILTER (WHERE gps_coordinates IS NOT NULL) as photos_with_gps,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as recent_uploads
    FROM public.media
    WHERE owner_profile_id = p_agent_id;
END;
$$;

-- Commentaires sur les fonctions
COMMENT ON FUNCTION get_media_by_entity(text, uuid) IS 'Recupere tous les medias lies a une entite specifique';
COMMENT ON FUNCTION get_agent_media(uuid, integer) IS 'Recupere tous les medias d un agent avec limite';
COMMENT ON FUNCTION delete_media(uuid) IS 'Supprime un media (verifie les permissions)';
COMMENT ON FUNCTION create_media(text, uuid, text, text, text, uuid, bigint, numeric, numeric, timestamptz, text, text[]) IS 'Cree un enregistrement media apres upload storage';
COMMENT ON FUNCTION get_agent_media_stats(uuid) IS 'Recupere les statistiques des medias d un agent';

-- Test des fonctions
DO $$
DECLARE
    test_agent_id uuid;
    test_plot_id uuid;
    media_count integer;
BEGIN
    -- Récupérer un agent de test
    SELECT profiles.user_id INTO test_agent_id
    FROM public.profiles
    WHERE profiles.role = 'agent'
    LIMIT 1;

    -- Récupérer une parcelle de test
    SELECT plots.id INTO test_plot_id
    FROM public.plots
    LIMIT 1;

    IF test_agent_id IS NOT NULL AND test_plot_id IS NOT NULL THEN
        -- Tester get_media_by_entity
        SELECT COUNT(*) INTO media_count
        FROM get_media_by_entity('plot', test_plot_id);
        
        RAISE NOTICE 'Test get_media_by_entity: % médias trouvés pour parcelle %', media_count, test_plot_id;
        
        -- Tester get_agent_media
        SELECT COUNT(*) INTO media_count
        FROM get_agent_media(test_agent_id, 10);
        
        RAISE NOTICE 'Test get_agent_media: % médias trouvés pour agent %', media_count, test_agent_id;
    ELSE
        RAISE NOTICE 'Aucun agent ou parcelle trouvé pour les tests';
    END IF;
END;
$$;
