-- Migration: Configuration de Supabase Storage pour les médias
-- Description: Création du bucket media et des politiques RLS
-- Date: 2025-01-02

-- 1. Créer le bucket 'media' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true, -- Bucket public pour les URLs publiques
  10485760, -- 10MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Politique RLS pour permettre la lecture des fichiers publics
CREATE POLICY "Media files are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- 4. Politique RLS pour permettre la suppression par le propriétaire
CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Politique RLS pour permettre la mise à jour par le propriétaire
CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Fonction pour générer un nom de fichier unique
CREATE OR REPLACE FUNCTION generate_media_filename(
  entity_type text,
  entity_id uuid,
  file_extension text
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN entity_type || '/' || entity_id || '/' || 
         extract(epoch from now())::bigint || '_' || 
         substr(md5(random()::text), 1, 8) || 
         file_extension;
END;
$$;

-- 7. Fonction pour nettoyer les fichiers orphelins
CREATE OR REPLACE FUNCTION cleanup_orphaned_media_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_record RECORD;
  orphaned_count INTEGER := 0;
BEGIN
  -- Trouver les fichiers dans le storage qui n'ont pas d'enregistrement correspondant dans la table media
  FOR file_record IN
    SELECT name, bucket_id
    FROM storage.objects
    WHERE bucket_id = 'media'
      AND name NOT IN (
        SELECT file_path
        FROM public.media
        WHERE file_path IS NOT NULL
      )
  LOOP
    -- Supprimer le fichier orphelin
    PERFORM storage.delete_object(file_record.bucket_id, file_record.name);
    orphaned_count := orphaned_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Nettoyage terminé: % fichiers orphelins supprimés', orphaned_count;
END;
$$;

-- 8. Créer un index sur la table media pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_media_entity_type_id ON public.media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_owner_profile_id ON public.media(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at);

-- 9. Commentaires
COMMENT ON FUNCTION generate_media_filename(text, uuid, text) IS 'Génère un nom de fichier unique pour les médias';
COMMENT ON FUNCTION cleanup_orphaned_media_files() IS 'Nettoie les fichiers orphelins du storage';

-- 10. Test de la configuration
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Vérifier que le bucket existe
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'media'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Bucket "media" créé avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: Bucket "media" non trouvé';
  END IF;
  
  -- Vérifier les politiques RLS
  IF EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload media files'
  ) THEN
    RAISE NOTICE '✅ Politiques RLS configurées avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: Politiques RLS non trouvées';
  END IF;
END;
$$;
