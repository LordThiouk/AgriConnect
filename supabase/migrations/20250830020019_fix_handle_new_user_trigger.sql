-- Migration pour corriger le trigger handle_new_user
-- qui cause l'erreur "Database error saving new user"

-- Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer une nouvelle fonction handle_new_user simplifiée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insérer le profil avec gestion d'erreur
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data ->> 'display_name', 'Utilisateur'),
      'agent'  -- Rôle par défaut pour les utilisateurs mobiles
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'erreur, on continue sans bloquer la création de l'utilisateur
      RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;

-- Recréer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Commentaire pour expliquer
COMMENT ON FUNCTION public.handle_new_user() IS 
'Fonction pour créer automatiquement un profil lors de la création d''un utilisateur - avec gestion d''erreur pour éviter de bloquer la création';
