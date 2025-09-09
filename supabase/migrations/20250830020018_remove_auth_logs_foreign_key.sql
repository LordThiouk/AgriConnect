-- Migration pour supprimer complètement la contrainte de clé étrangère auth_logs
-- qui empêche la création d'utilisateurs

-- Supprimer complètement la contrainte de clé étrangère
ALTER TABLE public.auth_logs 
DROP CONSTRAINT IF EXISTS auth_logs_user_id_fkey;

-- Supprimer l'index associé s'il existe
DROP INDEX IF EXISTS idx_auth_logs_user_id;

-- Commentaire pour expliquer
COMMENT ON TABLE public.auth_logs IS 
'Table de logs d authentification - contrainte de clé étrangère supprimée temporairement pour résoudre le problème de création d utilisateurs';

-- Créer un index simple sur user_id sans contrainte
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id_simple 
ON public.auth_logs(user_id);
