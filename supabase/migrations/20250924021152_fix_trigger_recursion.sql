-- Migration: Correction du trigger de synchronisation automatique
-- Date: 2025-01-24
-- Description: Corriger le trigger pour éviter la récursion infinie

-- 1. Supprimer l'ancien trigger et sa fonction
DROP TRIGGER IF EXISTS trigger_auto_sync_phone ON profiles;
DROP FUNCTION IF EXISTS auto_sync_phone_from_auth();

-- 2. Créer une nouvelle fonction de trigger qui évite la récursion
CREATE OR REPLACE FUNCTION auto_sync_phone_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Seulement si le profil a un user_id ET n'a pas de téléphone
  IF NEW.user_id IS NOT NULL AND (NEW.phone IS NULL OR NEW.phone = '') THEN
    -- Récupérer le numéro de téléphone depuis auth.users
    -- Utiliser une sous-requête pour éviter la récursion
    NEW.phone := (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = NEW.user_id 
        AND au.phone IS NOT NULL 
        AND au.phone != ''
      LIMIT 1
    );
    
    -- Mettre à jour le timestamp
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Créer le trigger AVANT INSERT/UPDATE (pas AFTER)
DROP TRIGGER IF EXISTS trigger_auto_sync_phone ON profiles;
CREATE TRIGGER trigger_auto_sync_phone
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_phone_from_auth();

-- 4. Créer une fonction pour tester le trigger
CREATE OR REPLACE FUNCTION test_auto_sync_trigger()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_profile_id UUID;
  existing_user_id UUID;
  phone_before TEXT;
  phone_after TEXT;
BEGIN
  -- Trouver un utilisateur auth existant avec téléphone
  SELECT au.id, au.phone INTO existing_user_id, phone_before
  FROM auth.users au 
  WHERE au.phone IS NOT NULL AND au.phone != ''
  LIMIT 1;
  
  -- Si aucun utilisateur auth avec téléphone, retourner un échec
  IF existing_user_id IS NULL THEN
    RETURN QUERY
    SELECT 
      'trigger_test'::TEXT,
      'SKIPPED'::TEXT,
      'No auth users with phone found for testing';
    RETURN;
  END IF;
  
  -- Créer un profil de test avec un user_id existant
  INSERT INTO profiles (
    user_id,
    display_name,
    role,
    is_active,
    approval_status
  ) VALUES (
    existing_user_id,
    'Test Trigger Auto Sync',
    'producer',
    true,
    'approved'
  ) RETURNING id INTO test_profile_id;
  
  -- Récupérer le profil créé
  SELECT phone INTO phone_after
  FROM profiles 
  WHERE id = test_profile_id;
  
  -- Nettoyer le profil de test
  DELETE FROM profiles WHERE id = test_profile_id;
  
  -- Retourner les résultats
  RETURN QUERY
  SELECT 
    'trigger_test'::TEXT,
    CASE 
      WHEN phone_after IS NOT NULL AND phone_after != '' THEN 'SUCCESS'
      ELSE 'FAILED'
    END::TEXT,
    'Phone before: ' || COALESCE(phone_before, 'NULL') || ', Phone after: ' || COALESCE(phone_after, 'NULL');
END;
$$;

-- 5. Commentaires sur les fonctions
COMMENT ON FUNCTION auto_sync_phone_from_auth() IS 
'Trigger pour synchroniser automatiquement les numéros de téléphone depuis auth.users vers profiles.phone (version corrigée)';

COMMENT ON FUNCTION test_auto_sync_trigger() IS 
'Teste le fonctionnement du trigger de synchronisation automatique';

-- 6. Le trigger est créé et prêt à être testé
-- Pour tester, exécuter manuellement : SELECT * FROM test_auto_sync_trigger();
