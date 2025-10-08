-- Migration: Correction simple de la synchronisation
-- Date: 2025-01-24
-- Description: Remplacer les fonctions problématiques par des versions simples

-- 1. Supprimer les fonctions problématiques
DROP FUNCTION IF EXISTS sync_all_existing_profiles();
DROP FUNCTION IF EXISTS check_phone_sync_status();

-- 2. Créer une fonction de synchronisation très simple
CREATE OR REPLACE FUNCTION sync_all_existing_profiles()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Synchroniser tous les profils avec user_id mais sans téléphone
  UPDATE profiles 
  SET 
    phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = profiles.user_id 
        AND au.phone IS NOT NULL 
        AND au.phone != ''
    ),
    updated_at = NOW()
  WHERE user_id IS NOT NULL 
    AND (phone IS NULL OR phone = '');
  
  -- Compter les mises à jour
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Retourner un message simple
  RETURN 'Synchronisation terminée: ' || updated_count || ' profils mis à jour';
END;
$$;

-- 3. Créer une fonction de vérification très simple
CREATE OR REPLACE FUNCTION check_phone_sync_status()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_profiles_count INTEGER;
  with_phone_count INTEGER;
  auth_phone_count INTEGER;
  result_text TEXT;
BEGIN
  -- Compter les profils totaux
  SELECT COUNT(*) INTO total_profiles_count FROM profiles;
  
  -- Compter les profils avec téléphone
  SELECT COUNT(*) INTO with_phone_count 
  FROM profiles 
  WHERE phone IS NOT NULL AND phone != '';
  
  -- Compter les utilisateurs auth avec téléphone
  SELECT COUNT(*) INTO auth_phone_count 
  FROM auth.users 
  WHERE phone IS NOT NULL AND phone != '';

  -- Créer un message de résultat
  result_text := 'Statut: ' || total_profiles_count || ' profils totaux, ' || 
                 with_phone_count || ' avec téléphone, ' || 
                 auth_phone_count || ' utilisateurs auth avec téléphone';

  RETURN result_text;
END;
$$;

-- 4. Commentaires sur les fonctions
COMMENT ON FUNCTION sync_all_existing_profiles() IS 
'Synchronise tous les profils existants avec les numéros de téléphone (version simple)';

COMMENT ON FUNCTION check_phone_sync_status() IS 
'Vérifie l''état de la synchronisation des numéros de téléphone (version simple)';
