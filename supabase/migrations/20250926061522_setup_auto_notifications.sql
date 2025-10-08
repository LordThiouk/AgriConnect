-- Setup auto-notifications system BASÉ ÉVÉNEMENTS uniquement
-- 🚨 NOUVELLE alerte URGENT → SMS automatique
-- 💡 NOUVELLE recommandation → Push automatique
-- ❌ PAS de timer/cron - seulement déclenché à l'événement

SET search_path TO public, auth;

-- ================================
-- 1. Fonction SQL qui déclenche après chaque NOUVELLE recommandation
-- ================================

CREATE OR REPLACE FUNCTION auto_create_notifications_from_recommendations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  producer_profile_id UUID;
  producer_phone TEXT;
BEGIN
  -- Trouver l'user_id du producteur via producers et profiles
  IF NEW.producer_id IS NOT NULL THEN
    SELECT p.user_id, pr.phone 
    INTO producer_profile_id, producer_phone
    FROM public.producers pr
    LEFT JOIN public.profiles p ON p.user_id = pr.profile_id
    WHERE pr.id = NEW.producer_id;
  END IF;
  
  -- 🚨 NOUVELLE ALERTE URGENTE → SMS IMMÉDIAT
  IF NEW.priority = 'urgent' OR NEW.title LIKE '%🚨 ALERTE%' THEN
    -- SMS automatique pour alertes critiques
    INSERT INTO public.notifications (
      title,
      body,
      channel,
      profile_id,
      status,
      provider,
      created_at
    ) VALUES (
      NEW.title,
      NEW.message,
      'sms',
      producer_profile_id,
      'pending',
      'twilio',
      NOW()
    );
    
    RAISE NOTICE 'EVE AUTO-SMS créé pour nouvelle alerte urgente: %', NEW.title;
  END IF;
  
  -- 💡 NOUVELLE RECOMMANDATION → Push IMMÉDIAT
  IF NEW.priority IN ('medium', 'high') AND (NEW.title LIKE '%💡 RECOMMANDATION%') THEN
    INSERT INTO public.notifications (
      title,
      body,
      channel,
      profile_id,
      status, 
      provider,
      created_at
    ) VALUES (
      NEW.title,
      NEW.message,
      'push',
      producer_profile_id,
      'pending',
      'expo',
      NOW()
    );
    
    RAISE NOTICE 'EVE AUTO-Push créé pour nouvelle recommandation: %', NEW.title;
  END IF;
  
  -- La partie automatique de traitement est gérée par un autre process Edge functions
  
  -- Juste retourner et on va s'en occuper
  -- L'insertion des notifications va ensuite être traitée automatiquement
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur auto-notification: %, pour recom_id:%', SQLERRM, NEW.id;
    RETURN NEW;
END;
$$;

-- ================================
-- 2. Trigger qui se déclenche SEULEMENT sur les NOUVELLES recommandations
-- ================================

-- Droper l'ancien trigger si il existe
DROP TRIGGER IF EXISTS trigger_auto_create_notifications ON public.recommendations;

-- Créer le trigger AFER INSERT ONLY (événements)
CREATE TRIGGER trigger_auto_create_notifications
  AFTER INSERT ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_notifications_from_recommendations();

-- ================================
-- 3. Commentaires
-- ================================

COMMENT ON FUNCTION auto_create_notifications_from_recommendations IS 
'Nouvelle recommandation détectée=(event) → lance notification appropriée:
🚨 URGENT si priorité=urgent ou titre contient ALERT 
💡 PUSH si priorité=medium/high + titre contient RECOMMANDATION
✅ IMMÉDIAT pas juste stockage ; lance send-notifications edge immediat';
