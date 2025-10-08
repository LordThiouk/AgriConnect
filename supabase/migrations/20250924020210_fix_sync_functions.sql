-- Migration: Correction des fonctions de synchronisation
-- Date: 2025-01-24
-- Description: Corriger les fonctions de synchronisation pour éviter la récursion infinie

-- 1. Supprimer les fonctions problématiques
DROP FUNCTION IF EXISTS sync_all_existing_profiles();
DROP FUNCTION IF EXISTS check_phone_sync_status();

-- 2. Créer une fonction de synchronisation simple et sûre
CREATE OR REPLACE FUNCTION sync_all_existing_profiles()
RETURNS TABLE (
  profiles_updated INTEGER,
  total_profiles INTEGER,
  profiles_with_user_id INTEGER,
  profiles_with_phone INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  total_count INTEGER := 0;
  with_user_id_count INTEGER := 0;
  with_phone_count INTEGER := 0;
BEGIN
  -- Compter les profils totaux
  SELECT COUNT(*) INTO total_count FROM profiles;
  
  -- Compter les profils avec user_id
  SELECT COUNT(*) INTO with_user_id_count 
  FROM profiles 
  WHERE user_id IS NOT NULL;
  
  -- Compter les profils avec téléphone
  SELECT COUNT(*) INTO with_phone_count 
  FROM profiles 
  WHERE phone IS NOT NULL AND phone != '';
  
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

  -- Retourner les statistiques
  RETURN QUERY SELECT updated_count, total_count, with_user_id_count, with_phone_count;
END;
$$;

-- 3. Créer une fonction de vérification simple
CREATE OR REPLACE FUNCTION check_phone_sync_status()
RETURNS TABLE (
  total_profiles INTEGER,
  profiles_with_user_id INTEGER,
  profiles_with_phone INTEGER,
  profiles_synced INTEGER,
  auth_users_with_phone INTEGER,
  sync_coverage_percent NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_profiles_count INTEGER;
  with_user_id_count INTEGER;
  with_phone_count INTEGER;
  synced_count INTEGER;
  auth_phone_count INTEGER;
  coverage_percent NUMERIC;
BEGIN
  -- Compter les profils totaux
  SELECT COUNT(*) INTO total_profiles_count FROM profiles;
  
  -- Compter les profils avec user_id
  SELECT COUNT(*) INTO with_user_id_count 
  FROM profiles 
  WHERE user_id IS NOT NULL;
  
  -- Compter les profils avec téléphone
  SELECT COUNT(*) INTO with_phone_count 
  FROM profiles 
  WHERE phone IS NOT NULL AND phone != '';
  
  -- Compter les profils synchronisés (avec user_id ET téléphone)
  SELECT COUNT(*) INTO synced_count 
  FROM profiles 
  WHERE user_id IS NOT NULL 
    AND phone IS NOT NULL 
    AND phone != '';
  
  -- Compter les utilisateurs auth avec téléphone
  SELECT COUNT(*) INTO auth_phone_count 
  FROM auth.users 
  WHERE phone IS NOT NULL AND phone != '';
  
  -- Calculer le pourcentage de couverture
  IF auth_phone_count > 0 THEN
    coverage_percent := (synced_count::NUMERIC / auth_phone_count::NUMERIC) * 100;
  ELSE
    coverage_percent := 0;
  END IF;

  -- Retourner les statistiques
  RETURN QUERY 
  SELECT 
    total_profiles_count,
    with_user_id_count,
    with_phone_count,
    synced_count,
    auth_phone_count,
    coverage_percent;
END;
$$;

-- 4. Commentaires sur les fonctions
COMMENT ON FUNCTION sync_all_existing_profiles() IS 
'Synchronise tous les profils existants avec les numéros de téléphone depuis auth.users (version corrigée)';

COMMENT ON FUNCTION check_phone_sync_status() IS 
'Vérifie l''état de la synchronisation des numéros de téléphone (version corrigée)';
