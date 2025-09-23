-- Créer la fonction RPC pour supprimer une notification
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
  
  -- Log de la suppression (optionnel)
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    old_data,
    new_data,
    user_id,
    created_at
  ) VALUES (
    'notifications',
    'DELETE',
    p_notification_id,
    '{}',
    '{}',
    auth.uid(),
    NOW()
  );
END;
$$;

-- Permettre l'exécution de la fonction pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_notification(UUID) TO authenticated;
