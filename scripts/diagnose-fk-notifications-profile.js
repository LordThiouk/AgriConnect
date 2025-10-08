/**
 * Diagnostic contrainte FK notifications.profile_id
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DIAGNOSTIC CONTOUR FK NOTIFICATIONS.PROFILE_ID');
console.log('==================================================');

async function diagnoseNotificationProfileFK() {
  try {
    // Étape 1: List des profils dataset 
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name')
      .not('id', 'is', 'null');
  
    if (profilesError) {
      console.error('❌ ERREUR récupération profils:', profilesError);
      return;
    }
    
    console.log(`\n📋 PROFILE CORRESPONDANT:  ${profilesData.length}`);
    
    if (profilesData.length > 0) {
      console.log('Profils disponibles:');
      profilesData.forEach((h, i) => {
        console.log(`   ${i+1}. ID ${h.id} | user_id: ${h.user_id || 'N/A'} | display_name: ${h.display_name || 'N/A'}`);
      });
      
      // Test FK explicit with first valid profile - USING USER_ID instead of profiles.id
      const testUserId = profilesData[0].user_id;
      const testProfileId = profilesData[0].id;
      console.log(`\n🔧 TEST FK INSERT avec profile_id = ${testUserId} (user_id au lieu de profiles.id)`);
      
      const testData = {
        profile_id: testUserId,
        title: 'TEST FK DIAGNOSTIC MESSAGE',
        body: 'Test diagnostic FK',
        channel: 'sms',
        provider: 'twilio', 
        status: 'pending'
      };
      
      const { data: insResult, error: insErr } = await supabase
        .from('notifications')
        .insert(testData)
        .select()
        .single();

      if (insErr) {
        console.error('❌ INSERT FK FAILED:', insErr.message);
      } else {
        console.log(`✅ INTERACT FK VINDICATED: ${insResult.id}`);
        
        // Cleanup test record
        await supabase
          .from('notifications')
          .delete()
          .eq('id', insResult.id);
        console.log('🧹 Cleanend up test record');
      }
    } else {
      console.log('⚠️ NO PROFILES disponibles pour test FK');
    }

  } catch (e) {
    console.error('❌ ERROR prefix:', e.message);
  }
}

diagnoseNotificationProfileFK().catch(e => {
  console.error('🫡 UNHANDLED ERROR:', e.message);
});
