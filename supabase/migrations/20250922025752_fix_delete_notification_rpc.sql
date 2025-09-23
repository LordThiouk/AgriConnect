-- Corriger la fonction RPC pour supprimer une notification (sans audit_logs)
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que la notification existe
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE id = p_notification_id) THEN
    RAISE EXCEPTION 'Notification avec ID % non trouvée', p_notification_id;
  END IF;
  
  -- Supprimer la notification
  DELETE FROM notifications WHERE id = p_notification_id;
END;
$$;

-- Permettre l'exécution de la fonction pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_notification(UUID) TO authenticated;
