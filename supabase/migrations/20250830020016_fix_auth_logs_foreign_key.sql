-- Migration pour corriger la contrainte de clé étrangère auth_logs
-- qui empêche la création d'utilisateurs

-- Supprimer la contrainte de clé étrangère problématique
ALTER TABLE public.auth_logs 
DROP CONSTRAINT IF EXISTS auth_logs_user_id_fkey;

-- Recréer la contrainte avec ON DELETE CASCADE pour éviter les erreurs
-- quand un utilisateur est supprimé
ALTER TABLE public.auth_logs 
ADD CONSTRAINT auth_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Commentaire pour expliquer le changement
COMMENT ON CONSTRAINT auth_logs_user_id_fkey ON public.auth_logs IS 
'Clé étrangère vers auth.users avec CASCADE pour éviter les erreurs lors de la création d utilisateurs';
