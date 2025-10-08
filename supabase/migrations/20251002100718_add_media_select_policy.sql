-- Migration: Ajouter la politique SELECT manquante pour le bucket media
-- Description: Créer la politique de lecture pour les fichiers media
-- Date: 2025-01-02

-- 1. Vérifier et créer la politique de lecture manquante
DO $$
BEGIN
  -- Vérifier si la politique de lecture existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND policyname = 'Media files are publicly readable'
  ) THEN
    -- Créer la politique de lecture
    CREATE POLICY "Media files are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');
    
    RAISE NOTICE '✅ Politique de lecture créée';
  ELSE
    RAISE NOTICE 'ℹ️ Politique de lecture existe déjà';
  END IF;
END;
$$;

-- 2. Vérification finale de toutes les politiques
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
  
  RAISE NOTICE 'Politiques RLS finales pour le bucket media: %', policy_count;
  
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
    RAISE NOTICE '✅ Configuration RLS du bucket media COMPLÈTE !';
  ELSE
    RAISE WARNING '⚠️ Configuration RLS du bucket media incomplète (%/4 politiques)', policy_count;
  END IF;
END;
$$;
