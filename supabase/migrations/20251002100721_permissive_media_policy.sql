-- Migration: Politique RLS très permissive pour le bucket media
-- Description: Autoriser tous les uploads authentifiés sans restrictions
-- Date: 2025-01-02

-- 1. Supprimer toutes les politiques existantes pour le bucket media
DROP POLICY IF EXISTS "Authenticated users can upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Media files are publicly readable" ON storage.objects;

-- 2. Créer une politique très permissive pour l'upload
CREATE POLICY "Allow all authenticated uploads to media bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 3. Créer une politique très permissive pour la lecture
CREATE POLICY "Allow all reads from media bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- 4. Créer une politique très permissive pour la suppression
CREATE POLICY "Allow all authenticated deletes from media bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 5. Créer une politique très permissive pour la mise à jour
CREATE POLICY "Allow all authenticated updates to media bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 6. Vérification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND policyname LIKE '%media%';
  
  RAISE NOTICE 'Politiques RLS permissives créées pour le bucket media: %', policy_count;
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Configuration RLS permissive du bucket media complète !';
  ELSE
    RAISE WARNING '⚠️ Configuration RLS permissive du bucket media incomplète (%/4 politiques)', policy_count;
  END IF;
END;
$$;
