-- Migration: Correction des politiques RLS pour le bucket media
-- Description: Simplifier les politiques RLS pour permettre l'upload aux utilisateurs authentifiés
-- Date: 2025-01-02

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Media files are publicly readable" ON storage.objects;

-- 2. Créer des politiques RLS simplifiées pour le bucket media

-- Politique pour l'upload - tous les utilisateurs authentifiés peuvent uploader dans le bucket media
CREATE POLICY "Authenticated users can upload to media bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Politique pour la lecture - tous les fichiers du bucket media sont lisibles
CREATE POLICY "Media files are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Politique pour la suppression - les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Politique pour la mise à jour - les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Commentaires (supprimés pour éviter les problèmes de permissions)

-- 4. Test de la configuration
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Compter les politiques pour le bucket media
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND policyname LIKE '%media%';
  
  RAISE NOTICE 'Politiques RLS créées pour le bucket media: %', policy_count;
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Configuration RLS du bucket media réussie';
  ELSE
    RAISE WARNING '⚠️ Configuration RLS du bucket media incomplète';
  END IF;
END;
$$;
