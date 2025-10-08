/**
 * Script simple pour créer une notification SMS de test
 * Sert à tester rapidement le système de notifications
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d\'environnement');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSMSNotification(title = 'Test Notification', message = 'Message de test SMS') {
  console.log('📝 Création d\'une notification SMS de test');
  
  try {
    // 1. Trouver un profil avec téléphone ou en créer un
    let profileId;
    
    // Vérifier d'abord s'il existe déjà des profils avec téléphone
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, phone')
      .not('phone', 'is', null)
      .limit(1);

    if (!profilesError && existingProfiles && existingProfiles.length > 0) {
      profileId = existingProfiles[0].id;
      console.log(`✅ Utilisation du profil existant: ${profileId}`);
    } else {
      // Créer un profil de test temporaire
      console.log('⚠️ Aucun profil avec téléphone trouvé, création d\'un profil de test...');
      
      const testProfileData = {
        user_id: 'temp-test-user-' + Date.now(),
        display_name: 'Test SMS Notification',
        phone: '+221781234567', // Numéro de test pour le Sénégal
        role: 'test'
      };
      
      const { data: testProfile, error: testProfileError } = await supabase
        .from('profiles')
        .insert(testProfileData)
        .select()
        .single();
      
      if (testProfileError) {
        console.error('❌ Impossible de créer un profil de test:', testProfileError);
        return null;
      }
      
      profileId = testProfile.id;
      console.log(`✅ Profil de test créé: ${profileId}`);
    }

    // 2. Créer la notification
    const notificationData = {
      profile_id: profileId,
      title: title,
      body: message,
      channel: 'sms',
      provider: 'twilio',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Erreur création notification:', notificationError);
      return null;
    }

    console.log('✅ Notification SMS créée:', {
      id: notification.id,
      title: notification.title,
      channel: notification.channel,
      status: notification.status
    });

    return notification;

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return null;
  }
}

async function triggerSendNotifications() {
  console.log('🚀 Déclenchement de l\'envoi des notifications');
  
  try {
    // Essayer d'appeler l'Edge Function localement
    const functionUrl = 'http://127.0.0.1:54321/functions/v1/send-notifications';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (!response.ok) {
      console.log('⚠️ Edge Function inaccessible local. Vérifiez que Supabase est démarré.');
      console.log('   Lancez: supabase start');
      return null;
    }

    const result = await response.json();
    console.log('📊 Résultat de l\'envoi:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.error('❌ Erreur appel Edge Function:', error);
    return null;
  }
}

async function checkNotificationResults(notificationId) {
  console.log(`🔍 Vérification des résultats pour la notification ${notificationId}`);
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .select('id, title, body, status, sent_at, error_message, metadata')
    .eq('id', notificationId)
    .single();

  if (error) {
    console.error('❌ Erreur récupération notification:', error);
    return null;
  }

  console.log(`📋 État de la notification:`);
  console.log(`   📝 Titre: ${notification.title}`);
  console.log(`   📱 Corps: ${notification.body}`);
  console.log(`   📊 Statut: ${notification.status}`);
  
  if (notification.sent_at) {
    console.log(`   ✅ Envoyé à: ${notification.sent_at}`);
  }
  
  if (notification.error_message) {
    console.log(`   ❌ Erreur: ${notification.error_message}`);
  }
  
  if (notification.metadata) {
    console.log(`   🔗 Métadonnées:`, JSON.stringify(notification.metadata, null, 2));
  }

  return notification;
}

async function runTest() {
  console.log('🧪 Test complet du système SMS AgriConnect');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1. Créer une notification
  const notification = await createSMSNotification(
    '🧪 Test SMS AgriConnect',
    'Ceci est un message de test pour vérifier que l\'envoi SMS fonctionne correctement via Twilio.'
  );

  if (!notification) {
    console.log('❌ Impossible de créer la notification. Test arrêté.');
    return;
  }

  // 2. Attendre un peu pour être sûr
  console.log('⏳ Attente de 2 secondes...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. Déclencher l'envoi
  const sendResult = await triggerSendNotifications();
  
  if (sendResult && sendResult.ok) {
    console.log(`📊 Traitement: ${sendResult.processed} notifications`);
    if (sendResult.results) {
      console.log(`   ✅ Succès: ${sendResult.results.sent}`);
      console.log(`   ❌ Échecs: ${sendResult.results.failed}`);
    }
  }

  // 4. Vérifier le résultat
  console.log('⏳ Attente du traitement (3 sec)...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const finalResult = await checkNotificationResults(notification.id);
  
  if (finalResult) {
    if (finalResult.status === 'sent') {
      console.log('🎉 SUCCÈS - SMS envoyé avec succès via Twilio !');
    } else if (finalResult.status === 'failed') {
      console.log('❌ ÉCHEC - SMS non envoyé (vérifiez les credentials Twilio)');
    } else {
      console.log(`⏳ ATTENTE - Statut actuel: ${finalResult.status}`);
    }
  }

  return finalResult;
}

// Fonction exportée pour autres scripts
export { createSMSNotification, triggerSendNotifications, checkNotificationResults, runTest };

// Exécution si appellé directement
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTest()
    .then(result => {
      if (result && result.status === 'sent') {
        console.log('\n🎉 Test SMS RÉUSSI ! Le système de notifications fonctionne.');
        process.exit(0);
      } else {
        console.log('\n⚠️ Le test nécessite des credentials Twilio valides.');
        console.log('📖 Configuration: scripts/configure-twilio-supabase.js');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test échoué:', error);
      process.exit(1);
    });
}
