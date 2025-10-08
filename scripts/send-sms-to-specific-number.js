/**
 * Test SMS spécifique pour le numéro +221771945594
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📱 ENVOI SMS TEST - NUMÉRO CIBLÉ +221771945594');
console.log('=================================================');

async function sendSMSToTarget() {
  try {
    // 1. Vérifier si ce numéro existe dans profiles ou producers
    console.log('\n🔍 Recherche du numéro +221771945594...');
    
    let targetUserId = null;
    let notificationData = null;
    
    // Chercher dans profiles (agents)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, phone')
      .eq('phone', '+221771945594')
      .single();

    if (profile && profile.user_id) {
      targetUserId = profile.user_id;
      notificationData = {
        producer_id: null,
        profile_id: profile.user_id,
        title: '🧪 Test SMS AgriConnect Agent',
        body: `Hello ${profile.display_name || 'Agent'} ! Test système SMS AgriConnect depuis Twilio +17344071216. ✅ Message envoyé avec succès !`,
        channel: 'sms',
        provider: 'twilio',
        status: 'pending'
      };
      console.log(`✅ Trouvé comme AGENT: ${profile.display_name} (${profile.id})`);
    } else {
      // Chercher dans producers (producteurs)
      const { data: producer } = await supabase
        .from('producers')
        .select('id, first_name, last_name, phone')
        .eq('phone', '+221771945594')
        .single();

      if (producer) {
        targetUserId = producer.id;
        notificationData = {
          producer_id: producer.id,
          profile_id: null,
          title: '🧪 Test SMS AgriConnect Producteur',
          body: `Bonjour ${producer.first_name || 'Producteur'} ! Test système SMS AgriConnect. Vous recevrez bientôt les alertes et conseils de votre agent. 📱🌾`,
          channel: 'sms',
          provider: 'twilio',
          status: 'pending'
        };
        console.log(`✅ Trouvé comme PRODUCTEUR: ${producer.first_name} ${producer.last_name} (${producer.id})`);
      }
    }

    if (!notificationData) {
      console.log('❌ Numéro +221771945594 non trouvé dans la base');
      
      // L'unr et l'arrach tour scanlle is un ré limite trpt cette tenteux pour exis inventory 
      console.log('🔍 Tous les numéros disponibles pour debug:');
      const { data: allPhones } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .not('phone', 'is', 'null')
        .limit(5);
      
      if (allPhones) {
        allPhones.forEach(p => console.log(`   📞 Profiles: ${p.display_name} → ${p.phone}`));
      }
      
      // Néantlo our we balancer a manual notification for this specific number
      notificationData = {
        producer_id: '00000000-0000-0000-0000-000000000000', // Dummy ID pour test
        profile_id: null,
        title: '🧪 Test SMS Direct',
        body: `SMS direct vers +221771945594 depuis AgriConnect TWILIO +17344071216 ! ✅ Le système de notifications hybrides fonctionne parfaitement. 📱`,
        channel: 'sms',
        provider: 'twilio',
        status: 'pending'
      };
      console.log('⚠️  Création notification de test avec ID factice pour ce numéro');
    }

    // 2. Créer la notification de test
    console.log('\n📤 Création notification pour envoi...');
    
    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création notification:', createError.message);
      return;
    }

    console.log(`✅ Notification créée: ${createdNotification.id}`);

    // 3. Invocation Edge Function send-notifications
    console.log('\n🔧 Invocation immédiate Edge Function...');
    
    const { data: result, error: invokeError } = await supabase.functions.invoke('send-notifications', {
      body: { action: 'process_notifications' }
    });

    if (invokeError) {
      console.error('❌ Erreur invocation:', invokeError.message);
      return;
    }

    console.log('✅ Edge Function exécutée avec succès');
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    console.log('📋 Détails exécution:', JSON.stringify(parsedResult, null, 2));

    // 4. Vérification finale du statut
    console.log('\n📊 Vérification du statut d\'envoi...');
    
    const { data: finalNotification } = await supabase
      .from('notifications')
      .select('status, error_message, sent_at, metadata')
      .eq('id', createdNotification.id)
      .single();

    if (finalNotification) {
      console.log(`📈 Statut final: ${finalNotification.status}`);
      
      if (finalNotification.status === 'sent') {
        console.log('\n🎉 ✅ SMS ENVOYÉ AVEC SUCCÈS !');
        console.log(`📱 Message livré vers +221771945594`);
        console.log(`📅 Timestamp: ${finalNotification.sent_at}`);
        if (finalNotification.metadata) {
          console.log(`📊 Twilio SID: ${finalNotification.metadata.twilio_sid || 'N/A'}`);
        }
      } else if (finalNotification.status === 'failed') {
        console.log('\n❌ Échec envoi SMS');
        console.log(`💭 Raison: ${finalNotification.error_message}`);
      } else {
        console.log('\n⏳ Notification en cours de traitement...');
      }
    }

  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  }
}

// Lancement exécution
sendSMSToTarget().catch(e => console.error('🔥 UNHANDLED ERROR:', e.message));
