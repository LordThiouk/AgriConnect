-- Migration pour désactiver temporairement les triggers auth_logs
-- qui empêchent la création d'utilisateurs

-- Désactiver tous les triggers sur auth_logs
DROP TRIGGER IF EXISTS trigger_auth_logs_insert ON public.auth_logs;
DROP TRIGGER IF EXISTS trigger_auth_logs_update ON public.auth_logs;
DROP TRIGGER IF EXISTS trigger_auth_logs_delete ON public.auth_logs;

-- Désactiver les triggers sur profiles qui pourraient causer des logs
DROP TRIGGER IF EXISTS trigger_auto_sync_user_role ON public.profiles;
DROP TRIGGER IF EXISTS trigger_validate_profile_role ON public.profiles;

-- Commentaire pour expliquer
COMMENT ON TABLE public.auth_logs IS 
'Table de logs d authentification - triggers désactivés temporairement pour résoudre le problème de création d utilisateurs';

-- Créer une fonction simple pour handle_new_user sans logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insérer le profil sans déclencher de logs
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Utilisateur'),
    'agent'  -- Rôle par défaut pour les utilisateurs mobiles
  );
  RETURN new;
END;
$$;

-- Recréer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
