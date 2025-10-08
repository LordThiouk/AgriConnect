-- Migration: Synchronisation automatique des numéros de téléphone entre auth.users et profiles
-- Date: 2025-01-24
-- Description: Créer des fonctions pour synchroniser les numéros de téléphone depuis auth.users vers profiles.phone

-- 1. Fonction pour récupérer les numéros de téléphone depuis auth.users
CREATE OR REPLACE FUNCTION get_auth_users_with_phone()
RETURNS TABLE (
  id UUID,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Récupérer les utilisateurs depuis auth.users avec leur numéro de téléphone
  RETURN QUERY
  SELECT 
    au.id,
    au.phone,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE au.phone IS NOT NULL 
    AND au.phone != '';
END;
$$;

-- 2. Fonction pour synchroniser les numéros de téléphone vers profiles
CREATE OR REPLACE FUNCTION sync_phone_from_auth_to_profiles()
RETURNS TABLE (
  profiles_updated INTEGER,
  profiles_created INTEGER,
  total_auth_users INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  created_count INTEGER := 0;
  auth_users_count INTEGER := 0;
  auth_user RECORD;
BEGIN
  -- Compter les utilisateurs auth avec téléphone
  SELECT COUNT(*) INTO auth_users_count
  FROM auth.users 
  WHERE phone IS NOT NULL AND phone != '';

  -- Parcourir tous les utilisateurs auth avec téléphone
  FOR auth_user IN 
    SELECT id, phone, email, created_at
    FROM auth.users 
    WHERE phone IS NOT NULL AND phone != ''
  LOOP
    -- Vérifier si un profil existe pour cet utilisateur
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = auth_user.id) THEN
      -- Mettre à jour le profil existant
      UPDATE profiles 
      SET 
        phone = auth_user.phone,
        updated_at = NOW()
      WHERE user_id = auth_user.id 
        AND (phone IS NULL OR phone != auth_user.phone);
      
      -- Compter les mises à jour
      IF FOUND THEN
        updated_count := updated_count + 1;
      END IF;
    ELSE
      -- Créer un nouveau profil si l'utilisateur n'en a pas
      -- Note: Cette partie peut être adaptée selon vos besoins
      INSERT INTO profiles (
        user_id,
        display_name,
        phone,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        auth_user.id,
        COALESCE(auth_user.email, 'Utilisateur'),
        auth_user.phone,
        'producer', -- Rôle par défaut, peut être modifié
        true,
        auth_user.created_at,
        NOW()
      );
      
      created_count := created_count + 1;
    END IF;
  END LOOP;

  -- Retourner les statistiques
  RETURN QUERY SELECT updated_count, created_count, auth_users_count;
END;
$$;

-- 3. Fonction pour récupérer les producteurs avec leurs numéros de téléphone synchronisés
CREATE OR REPLACE FUNCTION get_producers_with_phone()
RETURNS TABLE (
  producer_id UUID,
  user_id UUID,
  display_name TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as producer_id,
    p.user_id,
    p.display_name,
    p.phone,
    p.role,
    p.is_active,
    p.created_at
  FROM profiles p
  WHERE p.role = 'producer' 
    AND p.phone IS NOT NULL 
    AND p.phone != '';
END;
$$;

-- 4. Trigger pour synchroniser automatiquement lors de la création/mise à jour d'un profil
CREATE OR REPLACE FUNCTION sync_phone_on_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si le profil a un user_id, essayer de synchroniser avec auth.users
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles 
    SET phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = NEW.user_id 
        AND au.phone IS NOT NULL 
        AND au.phone != ''
    )
    WHERE id = NEW.id 
      AND (phone IS NULL OR phone = '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_sync_phone_on_profile_change ON profiles;
CREATE TRIGGER trigger_sync_phone_on_profile_change
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_phone_on_profile_change();

-- 5. Fonction pour forcer la synchronisation de tous les profils
CREATE OR REPLACE FUNCTION force_sync_all_phones()
RETURNS TABLE (
  profiles_updated INTEGER,
  profiles_created INTEGER,
  total_auth_users INTEGER,
  sync_timestamp TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_result RECORD;
BEGIN
  -- Exécuter la synchronisation
  SELECT * INTO sync_result FROM sync_phone_from_auth_to_profiles();
  
  -- Retourner les résultats avec timestamp
  RETURN QUERY 
  SELECT 
    sync_result.profiles_updated,
    sync_result.profiles_created,
    sync_result.total_auth_users,
    NOW() as sync_timestamp;
END;
$$;

-- 6. Commentaires sur les fonctions
COMMENT ON FUNCTION get_auth_users_with_phone() IS 
'Récupère tous les utilisateurs auth.users avec leur numéro de téléphone';

COMMENT ON FUNCTION sync_phone_from_auth_to_profiles() IS 
'Synchronise les numéros de téléphone depuis auth.users vers profiles.phone';

COMMENT ON FUNCTION get_producers_with_phone() IS 
'Récupère tous les producteurs avec leurs numéros de téléphone synchronisés';

COMMENT ON FUNCTION sync_phone_on_profile_change() IS 
'Trigger pour synchroniser automatiquement les numéros lors de la création/mise à jour de profils';

COMMENT ON FUNCTION force_sync_all_phones() IS 
'Force la synchronisation de tous les numéros de téléphone avec timestamp';

-- 7. Exécuter la synchronisation initiale
SELECT * FROM force_sync_all_phones();
