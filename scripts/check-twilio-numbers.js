/**
 * Vérification des numéros Twilio associés au compte
 */

// Load environment variables
import { config } from 'dotenv';
config();

// Configuration Twilio via variables d'environnement
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token_here';

console.log('🔍 VÉRIFICATION DES NUMÉROS TWILIO DU COMPTE');
console.log('==========================================');

async function checkTwilioNumbers() {
  try {
    console.log('\n📋 Informations du compte:');
    console.log(`   Account SID: ${TWILIO_ACCOUNT_SID.substring(0, 14)}...`);
    console.log(`   Auth Token: ${TWILIO_AUTH_TOKEN.substring(0, 8)}...`);

    // Test avec numéros possibles actuellement disponibles
    const possibleNumbers = [
      '+18777804236',  // Numéro canadien que nous avons testé
      '+221771945594', // Numéro sénégalais original
      '+15551234567',  // Numéro US test standard
      '+447700900123', // Numéro UK test
    ];

    console.log('\n📱 Test de validation avec différents numéros de messagerie:');

    for (const number of possibleNumbers) {
      console.log(`\n   🔍 Test avec numéro: ${number}`);
      
      // Test direct via fetch vers l'API Twilio
      try {
        const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`      ✅ Connexion compte OK - ${data.incoming_phone_numbers?.length || 0} numéros trouvés`);
          
          if (data.incoming_phone_numbers) {
            for (const phone of data.incoming_phone_numbers) {
              if (phone.friendly_name && phone.phone_number) {
                console.log(`         📞 ${phone.phone_number} (${phone.friendly_name})`);
              }
            }
          }
        } else {
          console.log(`      ❌ Erreur connexion compte Twilio (${response.status})`);
        }
      } catch (error) {
        console.log(`      ❌ Connexion échouée: ${error.message}`);
      }
    }

    console.log('\n💡 Pour résoudre le problème, voici les étapes recommandées:');
    console.log('1. ☞ Connexion au dashboard Twilio de votre compte');
    console.log('2. ☞ Vérifier sous Phone Numbers / Manage / Active numbers');
    console.log('3. ☞ Copier le numéro phone verr (ex: +1234567890)');
    console.log('4. ☞ Reconfis ce numéro dans Supabase via:\n     supabase secrets set TWILIO_PHONE_NUMBER=<numéro_vu_dans_dashboard>');

  } catch (error) {
    console.error('\n💥 Erreur vérification:', error.message);
  }
}

// Exécution directe du test simple
console.log('🔧 EN ATTENDE DU VRAI NUMÉRO TWILIO À CORRIGER');

console.log('\n⚠️  SOLUTION RAPIDE:');
console.log('\n1️⃣ Ouvrez votre dashboard Twilio en ligne');
console.log('2️⃣ ✓ Allez dans Phone Numbers → Manage → Active numbers');
console.log('3️⃣ ✓ Cherchez un numéro actif répertorié (format +1234567890)');
console.log('4️⃣ ✉️ Partagez ce VRAI numéro avec moi pour résultat    ');

checkTwilioNumbers().catch(e => console.error('🔥 UNHANDLED:', e.message));
