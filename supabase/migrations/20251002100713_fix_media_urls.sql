-- Migration: Correction des URLs dans les fonctions RPC des médias
-- Description: Remplace current_setting par URL hardcodée
-- Date: 2025-01-02

-- 1. Corriger get_media_by_entity
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
        'https://swggnqbymblnyjcocqxi.supabase.co/storage/v1/object/public/media/' || m.file_path as public_url
    FROM public.media m
    WHERE m.entity_type = p_entity_type
      AND m.entity_id = p_entity_id
    ORDER BY m.created_at DESC;
END;
$$;

-- 2. Corriger get_agent_media
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
        'https://swggnqbymblnyjcocqxi.supabase.co/storage/v1/object/public/media/' || m.file_path as public_url,
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
