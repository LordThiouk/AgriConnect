-- Migration: Enhance Role Validation
-- Description: Améliore la validation des rôles lors de la création/modification des profils

-- Fonction pour valider et synchroniser un profil
CREATE OR REPLACE FUNCTION public.validate_and_sync_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Valider le rôle si fourni
  IF NEW.role IS NOT NULL AND NOT public.validate_user_role(NEW.role) THEN
    RAISE EXCEPTION 'Invalid role value for profiles.role: %', NEW.role;
  END IF;

  -- Si c'est un INSERT ou si le rôle a changé, synchroniser avec auth.users
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.role IS DISTINCT FROM NEW.role OR OLD.display_name IS DISTINCT FROM NEW.display_name)) THEN
    -- Récupérer les métadonnées actuelles
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.user_id;

    -- Construire les nouvelles métadonnées
    user_metadata := COALESCE(user_metadata, '{}'::jsonb);
    
    -- Mettre à jour le rôle si fourni
    IF NEW.role IS NOT NULL THEN
      user_metadata := jsonb_set(user_metadata, '{role}', to_jsonb(NEW.role));
    END IF;
    
    -- Mettre à jour le display_name si fourni
    IF NEW.display_name IS NOT NULL THEN
      user_metadata := jsonb_set(user_metadata, '{display_name}', to_jsonb(NEW.display_name));
    END IF;
    
    -- Mettre à jour la région si fournie
    IF NEW.region IS NOT NULL THEN
      user_metadata := jsonb_set(user_metadata, '{region}', to_jsonb(NEW.region));
    END IF;
    
    -- Mettre à jour la coopérative si fournie
    IF NEW.cooperative IS NOT NULL THEN
      user_metadata := jsonb_set(user_metadata, '{cooperative}', to_jsonb(NEW.cooperative));
    END IF;

    -- Mettre à jour les métadonnées utilisateur
    UPDATE auth.users 
    SET raw_user_meta_data = user_metadata,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Log de l'opération
    INSERT INTO auth_logs (user_id, event_type, platform, auth_method, user_role, success, metadata)
    VALUES (
      NEW.user_id, 
      'account_updated', 
      'web',
      'email_password',
      NEW.role,
      true,
      jsonb_build_object(
        'operation', TG_OP,
        'old_role', COALESCE(OLD.role, 'null'),
        'new_role', COALESCE(NEW.role, 'null'),
        'trigger', 'validate_and_sync_profile'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remplacer le trigger existant par le nouveau
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.profiles;
CREATE TRIGGER validate_and_sync_profile_trigger
  BEFORE INSERT OR UPDATE OF role, display_name, region, cooperative ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_sync_profile();

-- Commentaire sur le nouveau trigger
COMMENT ON TRIGGER validate_and_sync_profile_trigger ON public.profiles 
IS 'Valide et synchronise automatiquement les profils avec auth.users lors de la création/modification';

-- Fonction pour créer un profil avec validation
CREATE OR REPLACE FUNCTION public.create_profile_with_validation(
  p_user_id UUID,
  p_role TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_cooperative TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile public.profiles;
BEGIN
  -- Valider le rôle
  IF p_role IS NOT NULL AND NOT public.validate_user_role(p_role) THEN
    RAISE EXCEPTION 'Invalid role value: %', p_role;
  END IF;

  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist: %', p_user_id;
  END IF;

  -- Vérifier que le profil n'existe pas déjà
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Profile already exists for user: %', p_user_id;
  END IF;

  -- Créer le profil (le trigger se chargera de la synchronisation)
  INSERT INTO public.profiles (user_id, role, display_name, region, cooperative, created_at, updated_at)
  VALUES (p_user_id, p_role, p_display_name, p_region, p_cooperative, NOW(), NOW())
  RETURNING * INTO new_profile;

  RETURN new_profile;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.create_profile_with_validation(UUID, TEXT, TEXT, TEXT, TEXT) 
IS 'Crée un profil avec validation complète du rôle et synchronisation automatique';

-- Fonction pour mettre à jour un profil avec validation
CREATE OR REPLACE FUNCTION public.update_profile_with_validation(
  p_user_id UUID,
  p_role TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_cooperative TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  -- Valider le rôle si fourni
  IF p_role IS NOT NULL AND NOT public.validate_user_role(p_role) THEN
    RAISE EXCEPTION 'Invalid role value: %', p_role;
  END IF;

  -- Vérifier que le profil existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Profile does not exist for user: %', p_user_id;
  END IF;

  -- Mettre à jour le profil (le trigger se chargera de la synchronisation)
  UPDATE public.profiles 
  SET 
    role = COALESCE(p_role, role),
    display_name = COALESCE(p_display_name, display_name),
    region = COALESCE(p_region, region),
    cooperative = COALESCE(p_cooperative, cooperative),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.update_profile_with_validation(UUID, TEXT, TEXT, TEXT, TEXT) 
IS 'Met à jour un profil avec validation complète du rôle et synchronisation automatique';

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_profile_with_validation(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_with_validation(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
