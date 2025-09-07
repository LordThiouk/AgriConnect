-- Migration: Fix auth_logs columns in triggers
-- Description: Corrige les références aux colonnes inexistantes dans les triggers

-- Supprimer et recréer la fonction validate_and_sync_profile avec les bonnes colonnes
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

    -- Log de l'opération avec les bonnes colonnes
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

-- Supprimer et recréer la fonction sync_user_role_to_metadata avec les bonnes colonnes
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_metadata JSONB;
  current_metadata JSONB;
BEGIN
  -- Vérifier si le rôle a changé
  IF TG_OP = 'UPDATE' AND OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;

  -- Récupérer les métadonnées actuelles
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users 
  WHERE id = NEW.user_id;

  -- Construire les nouvelles métadonnées
  user_metadata := COALESCE(current_metadata, '{}'::jsonb);
  
  -- Mettre à jour le rôle
  user_metadata := jsonb_set(user_metadata, '{role}', to_jsonb(NEW.role));
  
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

  -- Log de l'opération avec les bonnes colonnes
  INSERT INTO auth_logs (user_id, event_type, platform, auth_method, user_role, success, metadata)
  VALUES (
    NEW.user_id, 
    'role_changed', 
    'web',
    'email_password',
    NEW.role,
    true,
    jsonb_build_object(
      'old_role', COALESCE(OLD.role, 'null'),
      'new_role', NEW.role,
      'trigger', 'auto_sync_user_role_to_metadata'
    )
  );

  RETURN NEW;
END;
$$;
