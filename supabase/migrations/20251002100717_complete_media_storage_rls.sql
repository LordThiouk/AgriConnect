-- Migration: Compléter les politiques RLS pour le bucket media
-- Description: Ajouter la politique manquante pour la mise à jour des fichiers
-- Date: 2025-01-02

-- 1. Vérifier et créer la politique de mise à jour manquante
DO $$
BEGIN
  -- Vérifier si la politique de mise à jour existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND policyname = 'Users can update their own media files'
  ) THEN
    -- Créer la politique de mise à jour
    CREATE POLICY "Users can update their own media files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'media' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
    
    RAISE NOTICE '✅ Politique de mise à jour créée';
  ELSE
    RAISE NOTICE 'ℹ️ Politique de mise à jour existe déjà';
  END IF;
END;
$$;

-- 2. Vérifier toutes les politiques du bucket media
DO $$
DECLARE
  policy_count INTEGER;
  policy_record RECORD;
BEGIN
  -- Compter les politiques pour le bucket media
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND policyname LIKE '%media%';
  
  RAISE NOTICE 'Politiques RLS actuelles pour le bucket media: %', policy_count;
  
  -- Lister toutes les politiques
  FOR policy_record IN
    SELECT policyname, cmd
    FROM pg_policies 
    WHERE tablename = 'objects' 
      AND policyname LIKE '%media%'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - %: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Configuration RLS du bucket media complète';
  ELSE
    RAISE WARNING '⚠️ Configuration RLS du bucket media incomplète (%/4 politiques)', policy_count;
  END IF;
END;
$$;
