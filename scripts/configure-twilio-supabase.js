/**
 * Script de configuration Twilio dans Supabase
 * Configure les variables d'environnement secrets pour Twilio
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration Twilio (à remplacer par vos vraies valeurs)
const TWILIO_CONFIG = {
  ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID',
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN',
  PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER'
};

async function configureSupabaseSecrets() {
  console.log('🔧 Configuration des secrets Twilio dans Supabase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const commands = [
    {
      name: 'TWILIO_ACCOUNT_SID',
      value: TWILIO_CONFIG.ACCOUNT_SID,
      command: `supabase secrets set TWILIO_ACCOUNT_SID="${TWILIO_CONFIG.ACCOUNT_SID}"`
    },
    {
      name: 'TWILIO_AUTH_TOKEN',
      value: TWILIO_CONFIG.AUTH_TOKEN,
      command: `supabase secrets set TWILIO_AUTH_TOKEN="${TWILIO_CONFIG.AUTH_TOKEN}"`
    },
    {
      name: 'TWILIO_PHONE_NUMBER',
      value: TWILIO_CONFIG.PHONE_NUMBER,
      command: `supabase secrets set TWILIO_PHONE_NUMBER="${TWILIO_CONFIG.PHONE_NUMBER}"`
    }
  ];

  console.log('📋 Commandes à exécuter :');
  commands.forEach(({ name, value, command }) => {
    const maskedValue = value.substring(0, 8) + '...';
    console.log(`   ${name}: ${maskedValue}`);
    console.log(`   → ${command}`);
    console.log('');
  });

  // Vérification que supabase CLI est disponible
  try {
    const { stdout } = await execAsync('supabase --version');
    console.log('✅ Supabase CLI trouvé:', stdout.trim());
  } catch (error) {
    console.error('❌ Supabase CLI non trouvé. Installez-le avec:');
    console.error('   npm install -g supabase');
    console.error('   https://supabase.com/docs/guides/cli/getting-started');
    return false;
  }

  // Exécution des commandes de configuration
  for (const { name, command } of commands) {
    try {
      console.log(`🔐 Configuration ${name}...`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('SUCCESS')) {
        console.log(`⚠️ Attention ${name}:`, stderr);
      } else {
        console.log(`✅ ${name} configuré avec succès`);
      }
    } catch (error) {
      console.error(`❌ Erreur configuration ${name}:`, error.message);
      console.error('💡 Vous pouvez manuellement exécuter:', command);
    }
  }

  console.log('\n🎯 Configuration terminée');
  console.log('📝 Rédéploiement de l\'Edge Function:');
  console.log('   supabase functions deploy send-notifications');
  console.log('');
  console.log('🧪 Test de l\'Edge Function:');
  console.log('   npm run test:sms');
  console.log('   node scripts/test-sms-notifications.js');
  
  return true;
}

async function checkCurrentSecrets() {
  console.log('📊 Vérification des secrets Supabase actuels');
  
  try {
    const { stdout } = await execAsync('supabase secrets list');
    console.log('🔄 Secrets actuels dans Supabase:');
    console.log(stdout);
  } catch (error) {
    console.log('⚠️ Impossible de lister les secrets (peut-être pas d\'initialisation locale)');
    console.log('   Assurez-vous que Supabase est démarré en local avec: supabase start');
  }
}

// Validation des credentials Twilio
function validateTwilioConfig() {
  console.log('🔍 Validation de la configuration Twilio');
  
  const validationChecks = [
    {
      field: 'ACCOUNT_SID',
      value: TWILIO_CONFIG.ACCOUNT_SID,
      pattern: /^AC[a-f0-9]{32}$/,
      requirement: 'Commence par AC et contient 32 caractères hexadécimaux'
    },
    {
      field: 'AUTH_TOKEN',
      value: TWILIO_CONFIG.AUTH_TOKEN,
      pattern: /^[a-f0-9]{32}$/,
      requirement: '32 caractères hexadécimaux'
    },
    {
      field: 'PHONE_NUMBER',
      value: TWILIO_CONFIG.PHONE_NUMBER,
      pattern: /^\+\d{1,3}\d{7,15}$/,
      requirement: 'Format international (+xxxxxxxxx)'
    }
  ];

  const issues = [];
  
  validationChecks.forEach(({ field, value, pattern, requirement }) => {
    if (value === undefined || value.includes('YOUR_TWILIO')) {
      issues.push(`❌ ${field} manquant ou non configuré`);
    } else if (!pattern.test(value)) {
      issues.push(`❌ ${field}: Format incorrect. Doit être: ${requirement}`);
    } else {
      console.log(`✅ ${field}: Format correct`);
    }
  });

  if (issues.length > 0) {
    console.log('\n🚨 Problèmes détectés:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n📖 Obtenez vos credentials sur: https://console.twilio.com');
    console.log('🔧 Configurez les variables d\'environnement local ou éditez ce script');
    return false;
  }

  console.log('✅ Configuration Twilio validée');
  return true;
}

// Fonction principale
async function main() {
  console.log('🚀 Configuration Twilio pour Supabase AgriConnect');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1. Validation de la configuration
  const configValid = validateTwilioConfig();
  
  // 2. Vérification des secrets actuels
  await checkCurrentSecrets();
  
  // 3. Configuration seulement si config valide
  if (configValid) {
    await configureSupabaseSecrets();
  } else {
    console.log('\n🛑 Configuration arrêtée. Corrigez les credentials d\'abord.');
    console.log('\n📝 Étapes suivantes:');
    console.log('   1. Créez votre compte Twilio sur https://console.twilio.com');
    console.log('   2. Récupérez vos credentials depuis votre tableau de bord');
    console.log('   3. Editez ce script avec vos vraies valeurs');
    console.log('   4. Relancez le script: node scripts/configure-twilio-supabase.js');
  }
}

// Lancer la configuration si exécuté directement
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main()
    .then(() => {
      console.log('\n🎉 Script de configuration terminé');
    })
    .catch(error => {
      console.error('\n💥 Erreur configuration:', error);
    });
}

export { main, validateTwilioConfig, configureSupabaseSecrets };
