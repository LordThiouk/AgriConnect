#!/usr/bin/env node

/**
 * Script de configuration Twilio pour AgriConnect
 * Ce script aide à configurer les variables d'environnement pour Twilio
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration Twilio pour AgriConnect\n');

// Vérifier si le fichier .env existe
const envPath = path.join(__dirname, '..', 'mobile', '.env');
const envExamplePath = path.join(__dirname, '..', 'mobile', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Création du fichier .env...');
  
  const envContent = `# Variables d'environnement pour l'application mobile AgriConnect

# Configuration Supabase
EXPO_PUBLIC_SUPABASE_URL=https://swggnqbymblnyjcocqxi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_SUPABASE_PROJECT_ID=swggnqbymblnyjcocqxi

# Mode test (true = utilise le service de test, false = utilise Twilio)
EXPO_PUBLIC_FORCE_TEST_MODE=true

# Configuration de développement
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env créé avec succès');
} else {
  console.log('✅ Fichier .env existe déjà');
}

console.log('\n📋 Instructions pour configurer Twilio :');
console.log('1. Allez dans Supabase Dashboard : https://supabase.com/dashboard');
console.log('2. Sélectionnez votre projet : swggnqbymblnyjcocqxi');
console.log('3. Allez dans Settings → Authentication → Phone Auth');
console.log('4. Activez "Enable phone confirmations"');
console.log('5. Configurez Twilio :');
console.log('   - Account SID : Votre Account SID Twilio');
console.log('   - Auth Token : Votre Auth Token Twilio');
console.log('   - From Number : Votre numéro Twilio (format +1234567890)');
console.log('\n6. Pour désactiver le mode test, modifiez dans mobile/.env :');
console.log('   EXPO_PUBLIC_FORCE_TEST_MODE=false');
console.log('\n7. Redémarrez l\'application mobile');

console.log('\n🔍 Vérification de la configuration actuelle :');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const forceTestMode = envContent.includes('EXPO_PUBLIC_FORCE_TEST_MODE=true');
  console.log(`Mode test : ${forceTestMode ? '✅ Activé' : '❌ Désactivé'}`);
} else {
  console.log('❌ Fichier .env non trouvé');
}

console.log('\n✨ Configuration terminée !');
