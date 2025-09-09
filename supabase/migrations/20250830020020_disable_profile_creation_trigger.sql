-- Migration pour désactiver complètement le trigger de création de profil
-- et laisser l'application gérer la création de profil

-- Supprimer complètement le trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Commentaire pour expliquer
COMMENT ON TABLE public.profiles IS 
'Table des profils utilisateurs - création manuelle via l''application (pas de trigger automatique)';

-- Créer une fonction utilitaire pour créer un profil manuellement
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_display_name text DEFAULT 'Utilisateur',
  p_role text DEFAULT 'agent'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profil déjà existant',
      'profile_id', (SELECT id FROM public.profiles WHERE user_id = p_user_id)
    );
  END IF;

  -- Créer le profil
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (p_user_id, p_display_name, p_role)
  RETURNING jsonb_build_object(
    'success', true,
    'profile_id', id,
    'user_id', user_id,
    'display_name', display_name,
    'role', role
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) TO anon;
