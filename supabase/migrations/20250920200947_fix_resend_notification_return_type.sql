-- Migration pour corriger le type de retour de resend_notification
-- Date: 2025-01-20
-- Description: Supprime et recrée resend_notification avec le bon type de retour

-- Supprimer l'ancienne fonction qui cause le conflit
DROP FUNCTION IF EXISTS resend_notification(uuid);

-- Recréer la fonction resend_notification avec le bon type de retour
CREATE OR REPLACE FUNCTION resend_notification(
  p_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  channel text,
  status text,
  sent_at timestamptz,
  recipient_name text,
  sender_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_notification_id uuid;
BEGIN
  -- Vérifier que la notification existe
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE id = p_id) THEN
    RAISE EXCEPTION 'Notification non trouvée';
  END IF;

  -- Mettre à jour la notification pour la renvoyer
  UPDATE notifications 
  SET 
    status = 'pending',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING id INTO updated_notification_id;

  -- Retourner la notification mise à jour
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.channel,
    n.status,
    n.sent_at,
    COALESCE(pr.display_name, 'Destinataire inconnu') as recipient_name,
    COALESCE(ps.display_name, 'Expéditeur inconnu') as sender_name
  FROM notifications n
  LEFT JOIN profiles pr ON n.recipient_id = pr.id
  LEFT JOIN profiles ps ON n.sent_by = ps.id
  WHERE n.id = updated_notification_id;
END;
$$;

COMMENT ON FUNCTION resend_notification IS 'Renvoie une notification existante avec détails complets';
