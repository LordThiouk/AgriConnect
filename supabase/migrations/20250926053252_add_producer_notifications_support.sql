-- Migration pour supporter les notifications aux producteurs non-inscrits
-- Permet d'envoyer des SMS aux producteurs sans compte auth.users

-- 1. Ajouter le champ producer_id à la table notifications
ALTER TABLE public.notifications 
ADD COLUMN producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE;

-- 2. Modifier la contrainte NOT NULL pour profile_id 
-- Maintenant profile_id peut être NULL si producer_id est fourni
ALTER TABLE public.notifications 
ALTER COLUMN profile_id DROP NOT NULL;

-- 2.5. Vérifier et nettoyer les données existantes non conformes
-- Supprimer les notifications sans profile_id ni données valides
DELETE FROM public.notifications 
WHERE profile_id IS NULL AND producer_id IS NULL;

-- 3. Ajouter une contrainte CHECK pour s'assurer qu'au moins un champ est rempli
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_recipient_check 
CHECK (
  (profile_id IS NOT NULL AND producer_id IS NULL) OR  -- Agent inscrit
  (profile_id IS NULL AND producer_id IS NOT NULL)     -- Producteur non-inscrit
);

-- 4. Mettre à jour les commentaires pour documenter le changement
COMMENT ON COLUMN public.notifications.profile_id IS 'User ID for registered agents (nullable if producer_id is set)';
COMMENT ON COLUMN public.notifications.producer_id IS 'Producer ID for unregistered producers getting SMS notifications (nullable if profile_id is set)';

-- 5. Index pour optimiser les requêtes de recherche par producteur
CREATE INDEX IF NOT EXISTS idx_notifications_producer_id ON public.notifications(producer_id) 
WHERE producer_id IS NOT NULL;

-- 6. Index pour optimiser les requêtes de recherche par agent  
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id) 
WHERE profile_id IS NOT NULL;

-- 7. Fonction utilitaire pour récupérer le téléphone d'une notification
CREATE OR REPLACE FUNCTION get_notification_phone(notification_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    phone_num TEXT;
    notif_profile_id UUID;
    notif_producer_id UUID;
BEGIN
    -- Récupérer les IDs de référence
    SELECT profile_id, producer_id 
    INTO notif_profile_id, notif_producer_id
    FROM public.notifications 
    WHERE id = notification_id;

    -- Si c'est un producteur (non-inscrit)
    IF notif_producer_id IS NOT NULL THEN
        SELECT phone INTO phone_num
        FROM public.producers 
        WHERE id = notif_producer_id;
    -- Si c'est un agent inscrit
    ELSIF notif_profile_id IS NOT NULL THEN
        SELECT phone INTO phone_num
        FROM public.profiles 
        WHERE user_id = notif_profile_id;
    END IF;

    RETURN phone_num;
END;
$$;

-- 8. Grant accès à la fonction
GRANT EXECUTE ON FUNCTION get_notification_phone(UUID) TO authenticated;

-- 9. RLS Policy pour les agents pour créer des notifications pour leurs producteurs
-- Les agents peuvent créer des notifications pour leurs producteurs assignés
CREATE POLICY "Agents can create notifications for their producers"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (producer_id IS NOT NULL AND profile_id IS NULL AND 
   producer_id IN (
     SELECT producer_id FROM public.agent_producer_assignments apa
     JOIN public.profiles p ON apa.agent_id = p.id
     WHERE p.user_id = auth.uid()
   )) OR
  (profile_id IS NOT NULL AND producer_id IS NULL AND profile_id = auth.uid())
);

-- 10. RLS Policy pour la lecture des notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  (profile_id = auth.uid()) OR
  (producer_id IS NOT NULL AND producer_id IN (
     SELECT producer_id FROM public.agent_producer_assignments apa
     JOIN public.profiles p ON apa.agent_id = p.id
     WHERE p.user_id = auth.uid()
   ))
);
