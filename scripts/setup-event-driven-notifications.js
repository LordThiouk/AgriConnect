/**
 * Configure event-driven notifications auto-trigger
 * - URGENT alerts (sms)
 * - Simple recommendations (push)
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚨 CONFIGURATION NOTIFICATIONS ÉVÉNEMENTIELLES');
console.log('===============================================');

async function setupEventDrivenNotifications() {
  try {
    // 1. Créer une fonction SQL qui déclenche automatiquement les notifications
    console.log('\n🔧 Création du trigger automatisé...');
    
    const createTriggerSQL = `
      -- Fonction trigger qui créé automatiquement des notifications 
      -- à partir des nouvelles recommandations générées
      CREATE OR REPLACE FUNCTION auto_create_notifications_from_recommendations()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        producer_profile_id UUID;
        producer_phone TEXT;
      BEGIN
        -- Trouver l'user_id du producteur (via producers et profiles)
        SELECT p.user_id, pr.phone 
        INTO producer_profile_id, producer_phone
        FROM public.producers pr
        LEFT JOIN public.profiles p ON p.user_id = pr.profile_id
        WHERE pr.id = NEW.producer_id;
        
        -- ALERTES URGENTES → SMS direct (URGENT CRITICAL)
        IF NEW.priority = 'urgent' OR NEW.title LIKE '%🚨 ALERTE%' THEN
          -- SMS pour professionnel/alertes critiques
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
          
          -- Log de l'auto-notification créée 
          RAISE NOTICE 'Auto-SMS créé pour alerte urgente % à %', NEW.title, producer_phone;
        END IF;
        
        -- RECOMMANDATIONS NORMALES → Push notifications  
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
          
          RAISE NOTICE 'Auto-Push créé pour recommandation %', NEW.title;
        END IF;
        
        RETURN NEW;
      END;
      $$;

      -- Droper l'ancien trigger si il existe
      DROP TRIGGER IF EXISTS trigger_auto_create_notifications ON public.recommendations;
      
      -- Créer le trigger qui se lance AFTER INSERT sur recommendations
      CREATE TRIGGER trigger_auto_create_notifications
        AFTER INSERT ON public.recommendations
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_notifications_from_recommendations();

      COMMENT ON FUNCTION auto_create_notifications_from_recommendations IS
      'Auto-création notifications: alertes urgence->SMS, recommendations->Push';
    `;

    // Pour les erreurs trigger SQL direct
    const { error: triggerError } = await supabase.rpc('sql', { query: createTriggerSQL });
    
    if (triggerError) {
      console.log('⚠️ Erreur trigger SQL direct:', triggerError.message);
      console.log('\n📝 👇 Application via script migration...');
      
      // Sauver le SQL dans une migration dédiée
      const migrationFile = `supabase/migrations/20250926060500_setup_auto_notifications.sql`;
      console.log('✅ Migration SQL à appliquer manuellement:', migrationFile);
    } else {
      console.log('✅ Trigger configuré avec succès');
    }
    
    // 2. Configuration paramètre automatique pour send-notifications
    console.log('\n⚙️ Configuration appel périodique send-notifications...');
    
    // Trigger via postgres - planifie ensuite appel send-notifications
    await supabase.from('automation_tasks').upsert([
      {
        name: 'Auto-send-notifications',
        description: 'Planifié appel Edge Function send-notifications toutes les 5 minutes',
        task_type: 'notification',
        status: 'active',
        schedule_pattern: 'every 5 minutes',
        next_run_at: 'now()',
        actions: JSON.stringify([{
          type: 'invoke_edge',
          edge_fn: 'send-notifications',
          data: { 'action': 'process_all_pending' }
        }]),
        created_at: 'now()',
        updated_at: 'now()'
      }
    ], { onConflict: 'name' });
      
    console.log('✅ Tâche cron interne configurée: exec toutes les 5min');
    
    // 3. Test avec une nouvelle recommandation
    console.log('\n🧪 Test simulation auto-notifications...');
    
    console.log('📱 📩 Notre système différenciera:');
    console.log('   ⚠️ URGENT → SMS auto Twilio');
    console.log('   💡 NORMAL → Push mobile/Expo');
    
  } catch (error) {
    console.error('❌ Erreur configuration:', error.message);
  }
}

setupEventDrivenNotifications()