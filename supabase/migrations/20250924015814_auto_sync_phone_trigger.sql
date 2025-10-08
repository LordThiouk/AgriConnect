-- Migration: Synchronisation automatique des numéros de téléphone
-- Date: 2025-01-24
-- Description: Créer un trigger pour synchroniser automatiquement les numéros depuis auth.users vers profiles.phone

-- 1. Fonction de synchronisation automatique des numéros de téléphone
CREATE OR REPLACE FUNCTION auto_sync_phone_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si le profil a un user_id, essayer de synchroniser avec auth.users
  IF NEW.user_id IS NOT NULL THEN
    -- Récupérer le numéro de téléphone depuis auth.users
    UPDATE profiles 
    SET 
      phone = (
        SELECT au.phone 
        FROM auth.users au 
        WHERE au.id = NEW.user_id 
          AND au.phone IS NOT NULL 
          AND au.phone != ''
      ),
      updated_at = NOW()
    WHERE id = NEW.id
      AND (phone IS NULL OR phone = '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Créer le trigger pour la synchronisation automatique
DROP TRIGGER IF EXISTS trigger_auto_sync_phone ON profiles;
CREATE TRIGGER trigger_auto_sync_phone
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_phone_from_auth();

-- 3. Fonction pour synchroniser tous les profils existants
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
  profile_record RECORD;
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
  FOR profile_record IN 
    SELECT p.id, p.user_id
    FROM profiles p
    WHERE p.user_id IS NOT NULL 
      AND (p.phone IS NULL OR p.phone = '')
  LOOP
    -- Mettre à jour le profil avec le numéro depuis auth.users
    UPDATE profiles 
    SET 
      phone = (
        SELECT au.phone 
        FROM auth.users au 
        WHERE au.id = profile_record.user_id 
          AND au.phone IS NOT NULL 
          AND au.phone != ''
      ),
      updated_at = NOW()
    WHERE id = profile_record.id;
    
    -- Compter les mises à jour
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  -- Retourner les statistiques
  RETURN QUERY SELECT updated_count, total_count, with_user_id_count, with_phone_count;
END;
$$;

-- 4. Fonction pour vérifier l'état de la synchronisation
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

-- 5. Commentaires sur les fonctions
COMMENT ON FUNCTION auto_sync_phone_from_auth() IS 
'Trigger pour synchroniser automatiquement les numéros de téléphone depuis auth.users vers profiles.phone';

COMMENT ON FUNCTION sync_all_existing_profiles() IS 
'Synchronise tous les profils existants avec les numéros de téléphone depuis auth.users';

COMMENT ON FUNCTION check_phone_sync_status() IS 
'Vérifie l''état de la synchronisation des numéros de téléphone';

-- 6. Les fonctions sont créées et prêtes à être utilisées
-- Pour tester, exécuter manuellement :
-- SELECT * FROM sync_all_existing_profiles();
-- SELECT * FROM check_phone_sync_status();
