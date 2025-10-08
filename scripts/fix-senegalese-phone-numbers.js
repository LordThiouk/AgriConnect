/**
 * Script pour corriger le formatage des numéros sénégalais dans la base
 * S'assurer que tous les numéros sont au format international +221xxxxxxxxx
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

console.log('📱 CORRECTION DU FORMATAGE DES NUMÉROS SÉNÉGALAIS');
console.log('==================================================');

function formatSenegalesePhone(phone) {
  if (!phone) return null;
  
  // Nettoyer le numéro
  let cleanPhone = phone.toString().replace(/^0+/, '').replace(/[^0-9+]/g, '');
  
  // Si commence par 221, on garde tel quel
  if (cleanPhone.startsWith('221')) {
    return '+' + cleanPhone;
  }
  
  // Si commence par 77, 70, 78, on ajoute 221
  if (cleanPhone.match(/^(77|70|78|76|75)\d{7}$/)) {
    return '+221' + cleanPhone;
  }
  
  // Formatage base : 10 chiffres après code pays
  if (cleanPhone.length === 9 && cleanPhone.match(/^[678]\d{8}$/)) {
    return '+221' + cleanPhone;
  }
  
  // Sinon ajouter déjà +
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  return '+' + cleanPhone;
}

async function fixPhoneNumbers() {
  try {
    console.log('\n🔍 Analyse des numéros de téléphone actuels...');
    
    // Vérifier profiles
    console.log('\n👤 CORRECTION PROFILES');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone, display_name')
      .not('phone', 'is', 'null');
      
    if (profiles) {
      for (const profile of profiles) {
        const oldPhone = profile.phone;
        const newPhone = formatSenegalesePhone(profile.phone);
        
        if (newPhone !== oldPhone && newPhone) {
          console.log(`   📞 Mise à jour ${profile.display_name}: ${oldPhone} → ${newPhone}`);
          
          await supabase
            .from('profiles')
            .update({ phone: newPhone })
            .eq('id', profile.id);
        }
      }
    }
    
    // Vérifier producers
    console.log('\n🌾 CORRECTION PRODUCERS');  
    const { data: producers } = await supabase
      .from('producers')
      .select('id, first_name, last_name, phone')
      .not('phone', 'is', 'null');
      
    if (producers) {
      for (const producer of producers) {
        const oldPhone = producer.phone;
        const newPhone = formatSenegalesePhone(producer.phone);
        
        if (newPhone !== oldPhone && newPhone) {
          console.log(`   📞 Mise à jour ${producer.first_name}: ${oldPhone} → ${newPhone}`);
          
          await supabase
            .from('producers')
            .update({ phone: newPhone })
            .eq('id', producer.id);
        }
      }
    }
    
    console.log('\n✅ Formatage des numéros terminé avec succès !');
    console.log('📱 Tous les numéros sont maintenant au format international Twilio');
    
  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  }
}

// Exécution
fixPhoneNumbers().catch(e => console.error('🔥 UNHANDLED ERROR:', e.message));
