-- Migration: Auto-sync User Roles
-- Description: Crée un trigger pour synchroniser automatiquement les rôles entre profiles et user_metadata

-- Fonction pour synchroniser le rôle dans les métadonnées utilisateur
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

  -- Log de l'opération
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

-- Créer le trigger
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role, display_name, region, cooperative ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_metadata();

-- Commentaire sur le trigger
COMMENT ON TRIGGER sync_user_role_trigger ON public.profiles 
IS 'Synchronise automatiquement les rôles et métadonnées entre profiles et auth.users';

-- Fonction pour synchroniser tous les utilisateurs existants
CREATE OR REPLACE FUNCTION public.sync_all_user_roles()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  old_role TEXT,
  new_role TEXT,
  synced BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  current_metadata JSONB;
  updated_metadata JSONB;
  old_role_value TEXT;
BEGIN
  -- Parcourir tous les profils
  FOR profile_record IN 
    SELECT p.user_id, p.role, p.display_name, p.region, p.cooperative,
           u.email, u.raw_user_meta_data
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
  LOOP
    -- Récupérer le rôle actuel dans les métadonnées
    old_role_value := profile_record.raw_user_meta_data->>'role';
    
    -- Construire les nouvelles métadonnées
    updated_metadata := COALESCE(profile_record.raw_user_meta_data, '{}'::jsonb);
    updated_metadata := jsonb_set(updated_metadata, '{role}', to_jsonb(profile_record.role));
    
    IF profile_record.display_name IS NOT NULL THEN
      updated_metadata := jsonb_set(updated_metadata, '{display_name}', to_jsonb(profile_record.display_name));
    END IF;
    
    IF profile_record.region IS NOT NULL THEN
      updated_metadata := jsonb_set(updated_metadata, '{region}', to_jsonb(profile_record.region));
    END IF;
    
    IF profile_record.cooperative IS NOT NULL THEN
      updated_metadata := jsonb_set(updated_metadata, '{cooperative}', to_jsonb(profile_record.cooperative));
    END IF;

    -- Mettre à jour les métadonnées utilisateur
    UPDATE auth.users 
    SET raw_user_meta_data = updated_metadata,
        updated_at = NOW()
    WHERE id = profile_record.user_id;

    -- Retourner le résultat
    user_id := profile_record.user_id;
    email := profile_record.email;
    old_role := old_role_value;
    new_role := profile_record.role;
    synced := TRUE;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.sync_all_user_roles() 
IS 'Synchronise tous les rôles utilisateur existants entre profiles et auth.users';

-- Fonction pour vérifier la cohérence des rôles
CREATE OR REPLACE FUNCTION public.check_role_consistency()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  profile_role TEXT,
  metadata_role TEXT,
  is_consistent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    u.email,
    p.role as profile_role,
    u.raw_user_meta_data->>'role' as metadata_role,
    (p.role = u.raw_user_meta_data->>'role') as is_consistent
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.role IS NOT NULL;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.check_role_consistency() 
IS 'Vérifie la cohérence des rôles entre profiles et auth.users';

-- Créer une vue pour surveiller la cohérence des rôles
CREATE OR REPLACE VIEW public.role_consistency_report AS
SELECT 
  user_id,
  email,
  profile_role,
  metadata_role,
  is_consistent,
  CASE 
    WHEN is_consistent THEN '✅ Cohérent'
    WHEN profile_role IS NOT NULL AND metadata_role IS NULL THEN '⚠️ Rôle manquant dans metadata'
    WHEN profile_role IS NULL AND metadata_role IS NOT NULL THEN '⚠️ Rôle manquant dans profile'
    WHEN profile_role != metadata_role THEN '❌ Incohérent'
    ELSE '❓ Inconnu'
  END as status
FROM public.check_role_consistency();

-- Commentaire sur la vue
COMMENT ON VIEW public.role_consistency_report 
IS 'Rapport de cohérence des rôles entre profiles et auth.users';

-- Donner les permissions appropriées
GRANT SELECT ON public.role_consistency_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_role_consistency() TO authenticated;
