-- Migration: Fix Sync Functions
-- Description: Corrige les fonctions de synchronisation des rôles

-- Supprimer les objets dans le bon ordre
DROP VIEW IF EXISTS public.role_consistency_report;
DROP FUNCTION IF EXISTS public.check_role_consistency();
DROP FUNCTION IF EXISTS public.sync_all_user_roles();

-- Créer une fonction simplifiée pour synchroniser tous les utilisateurs
CREATE OR REPLACE FUNCTION public.sync_all_user_roles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Parcourir tous les profils
  FOR profile_record IN 
    SELECT p.user_id, p.role, p.display_name, p.region, p.cooperative
    FROM public.profiles p
    WHERE p.role IS NOT NULL
  LOOP
    -- Mettre à jour les métadonnées utilisateur
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'role', profile_record.role,
          'display_name', COALESCE(profile_record.display_name, raw_user_meta_data->>'display_name'),
          'region', COALESCE(profile_record.region, raw_user_meta_data->>'region'),
          'cooperative', COALESCE(profile_record.cooperative, raw_user_meta_data->>'cooperative')
        ),
        updated_at = NOW()
    WHERE id = profile_record.user_id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Créer une fonction pour vérifier la cohérence
CREATE OR REPLACE FUNCTION public.check_role_consistency()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inconsistent_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.role IS NOT NULL 
    AND (u.raw_user_meta_data->>'role' IS NULL OR p.role != u.raw_user_meta_data->>'role');
  
  RETURN inconsistent_count;
END;
$$;

-- Créer une vue simplifiée pour le rapport
CREATE OR REPLACE VIEW public.role_consistency_report AS
SELECT 
  p.user_id,
  u.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role,
  (p.role = u.raw_user_meta_data->>'role') as is_consistent,
  CASE 
    WHEN p.role = u.raw_user_meta_data->>'role' THEN '✅ Cohérent'
    WHEN p.role IS NOT NULL AND u.raw_user_meta_data->>'role' IS NULL THEN '⚠️ Rôle manquant dans metadata'
    WHEN p.role IS NULL AND u.raw_user_meta_data->>'role' IS NOT NULL THEN '⚠️ Rôle manquant dans profile'
    WHEN p.role != u.raw_user_meta_data->>'role' THEN '❌ Incohérent'
    ELSE '❓ Inconnu'
  END as status
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.role IS NOT NULL;

-- Commentaires
COMMENT ON FUNCTION public.sync_all_user_roles() 
IS 'Synchronise tous les rôles utilisateur existants entre profiles et auth.users - retourne le nombre d utilisateurs mis à jour';

COMMENT ON FUNCTION public.check_role_consistency() 
IS 'Vérifie la cohérence des rôles entre profiles et auth.users - retourne le nombre d utilisateurs incohérents';

COMMENT ON VIEW public.role_consistency_report 
IS 'Rapport de cohérence des rôles entre profiles et auth.users';

-- Permissions
GRANT SELECT ON public.role_consistency_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_role_consistency() TO authenticated;
