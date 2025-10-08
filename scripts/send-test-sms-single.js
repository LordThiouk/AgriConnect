/**
 * Test SMS spécifique pour le numéro +221770951543
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

console.log('📱 ENVOI SMS TEST - NUMÉRO CIBLÉ +221770951543');
console.log('=================================================');

async function sendTestSMS() {
  try {
    // 1. Trouver le profile avec ce numéro exact
    console.log('\n🔍 Recherche du profile avec le numéro +221770951543...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, phone')
      .eq('phone', '+221770951543')
      .single();

    if (profileError || !profile) {
      console.log('❌ Aucun profile trouvé avec ce numéro');
      console.log('🔍 Vérification des numéros existants...');
      
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .not('phone', 'is', 'null')
        .limit(5);
        
      if (allProfiles) {
        console.log('📞 Numéros disponibles:');
        allProfiles.forEach(p => console.log(`   • ${p.display_name}: ${p.phone}`));
      }
      return;
    }
    
    console.log(`✅ Profile trouvé: ${profile.display_name} (${profile.id})`);

    // 2. Créer une notification test pour ce profile spécifique
    console.log('\n📤 Création notification test...');
    
    const testNotification = {
      producer_id: null, // Pas un producteur
      profile_id: profile.user_id, // User ID de l'agent
      title: '🧪 Test SMS AgriConnect',
      body: 'Hello ! Ceci est un message de test du système de notifications AgriConnect. Si vous recevez ce SMS, le système fonctionne parfaitement ! 📱✅',
      channel: 'sms',
      provider: 'twilio',
      status: 'pending'
    };

    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création notification:', createError.message);
      return;
    }

    console.log(`✅ Notification créée: ${createdNotification.id}`);

    // 3. Invocation immédiate de l'Edge Function
    console.log('\n🔧 Invocation Edge Function send-notifications...');
    
    const { data: result, error: invokeError } = await supabase.functions.invoke('send-notifications', {
      body: { action: 'process_notifications' }
    });

    if (invokeError) {
      console.error('❌ Erreur invocation Edge Function:', invokeError.message);
      return;
    }

    console.log('✅ Edge Function invoquée');
    console.log('📋 Résultat:', JSON.stringify(result, null, 2));

    // 4. Vérification du statut de la notification
    console.log('\n📊 Vérification du statut...');
    
    const { data: updatedNotification } = await supabase
      .from('notifications')
      .select('status, error_message, sent_at, metadata')
      .eq('id', createdNotification.id)
      .single();

    if (updatedNotification) {
      console.log(`📈 Statut: ${updatedNotification.status}`);
      
      if (updatedNotification.status === 'sent') {
        console.log('🎉 ✅ SMS ENVOYÉ AVEC SUCCÈS !');
        console.log(`📅 Envoyé à: ${updatedNotification.sent_at}`);
      } else if (updatedNotification.status === 'failed') {
        console.log(`❌ Échec: ${updatedNotification.error_message}`);
      } else {
        console.log('⏳ Notification en attente...');
      }
    }

  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  }
}

// Exécution
sendTestSMS().catch(e => console.error('🔥 UNHANDLED ERROR:', e.message));
