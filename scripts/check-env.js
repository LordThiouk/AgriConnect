#!/usr/bin/env node

/**
 * Script de vérification du fichier .env
 * Vérifie la présence et la configuration des variables d'environnement
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 Vérification du fichier .env', 'cyan');
  log('='.repeat(50), 'cyan');

  const rootDir = process.cwd();
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, 'env.example');

  // 1. Vérifier la présence du fichier .env
  log('\n📁 Vérification de la présence des fichiers:', 'blue');
  
  if (fs.existsSync(envPath)) {
    log('✅ Fichier .env trouvé', 'green');
  } else {
    log('❌ Fichier .env manquant', 'red');
    log('   Créez le fichier .env à partir de env.example', 'yellow');
    return false;
  }

  if (fs.existsSync(envExamplePath)) {
    log('✅ Fichier env.example trouvé', 'green');
  } else {
    log('⚠️  Fichier env.example manquant', 'yellow');
  }

  // 2. Lire et analyser le contenu du .env
  log('\n📋 Analyse du contenu du .env:', 'blue');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    log(`   ${envLines.length} variables d'environnement trouvées`, 'green');

    // Variables requises pour AgriConnect
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_ROLE_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];

    log('\n🔧 Vérification des variables requises:', 'blue');
    
    const foundVars = [];
    const missingVars = [];
    const emptyVars = [];

    requiredVars.forEach(varName => {
      const line = envLines.find(line => line.startsWith(`${varName}=`));
      if (line) {
        const value = line.split('=')[1]?.trim();
        if (value && value !== '') {
          foundVars.push(varName);
          log(`   ✅ ${varName}`, 'green');
        } else {
          emptyVars.push(varName);
          log(`   ⚠️  ${varName} (vide)`, 'yellow');
        }
      } else {
        missingVars.push(varName);
        log(`   ❌ ${varName} (manquant)`, 'red');
      }
    });

    // 3. Vérifier les variables spécifiques à l'environnement
    log('\n🌍 Vérification de l\'environnement:', 'blue');
    
    const isDev = envContent.includes('NODE_ENV=development') || envContent.includes('NODE_ENV=dev');
    const isProd = envContent.includes('NODE_ENV=production') || envContent.includes('NODE_ENV=prod');
    
    if (isDev) {
      log('   🛠️  Environnement: Development', 'yellow');
    } else if (isProd) {
      log('   🚀 Environnement: Production', 'green');
    } else {
      log('   ⚠️  Environnement non spécifié', 'yellow');
    }

    // 4. Vérifier les URLs Supabase
    log('\n🔗 Vérification des URLs Supabase:', 'blue');
    
    const supabaseUrl = envLines.find(line => line.startsWith('SUPABASE_URL='))?.split('=')[1]?.trim();
    if (supabaseUrl) {
      if (supabaseUrl.includes('supabase.co')) {
        log('   ✅ URL Supabase valide', 'green');
      } else {
        log('   ⚠️  URL Supabase suspecte', 'yellow');
      }
    }

    // 5. Résumé
    log('\n📊 Résumé:', 'magenta');
    log('='.repeat(30), 'magenta');
    log(`Variables trouvées: ${foundVars.length}/${requiredVars.length}`, foundVars.length === requiredVars.length ? 'green' : 'yellow');
    log(`Variables vides: ${emptyVars.length}`, emptyVars.length > 0 ? 'yellow' : 'green');
    log(`Variables manquantes: ${missingVars.length}`, missingVars.length > 0 ? 'red' : 'green');

    if (missingVars.length > 0) {
      log('\n❌ Variables manquantes:', 'red');
      missingVars.forEach(varName => {
        log(`   - ${varName}`, 'red');
      });
    }

    if (emptyVars.length > 0) {
      log('\n⚠️  Variables vides:', 'yellow');
      emptyVars.forEach(varName => {
        log(`   - ${varName}`, 'yellow');
      });
    }

    // 6. Recommandations
    log('\n💡 Recommandations:', 'cyan');
    
    if (missingVars.length > 0 || emptyVars.length > 0) {
      log('   1. Copiez env.example vers .env', 'yellow');
      log('   2. Remplissez les valeurs manquantes', 'yellow');
      log('   3. Vérifiez vos clés Supabase et Twilio', 'yellow');
    } else {
      log('   ✅ Configuration .env complète!', 'green');
    }

    log('\n🔒 Sécurité:', 'cyan');
    log('   - Ne commitez jamais le fichier .env', 'yellow');
    log('   - Utilisez des clés de test en développement', 'yellow');
    log('   - Vérifiez les permissions du fichier .env', 'yellow');

    return missingVars.length === 0 && emptyVars.length === 0;

  } catch (error) {
    log(`❌ Erreur lors de la lecture du fichier .env: ${error.message}`, 'red');
    return false;
  }
}

function checkProjectStructure() {
  log('\n🏗️  Vérification de la structure du projet:', 'cyan');
  log('='.repeat(50), 'cyan');

  const requiredDirs = [
    'mobile',
    'web', 
    'supabase',
    'scripts'
  ];

  const requiredFiles = [
    'package.json',
    'README.md',
    'tsconfig.json'
  ];

  log('\n📁 Répertoires:', 'blue');
  requiredDirs.forEach(dir => {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      log(`   ✅ ${dir}/`, 'green');
    } else {
      log(`   ❌ ${dir}/ (manquant)`, 'red');
    }
  });

  log('\n📄 Fichiers:', 'blue');
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      log(`   ✅ ${file}`, 'green');
    } else {
      log(`   ❌ ${file} (manquant)`, 'red');
    }
  });
}

// Fonction principale
function main() {
  log('🚀 AgriConnect - Vérification de l\'environnement', 'bright');
  log('='.repeat(60), 'bright');

  const envOk = checkEnvFile();
  checkProjectStructure();

  log('\n' + '='.repeat(60), 'bright');
  
  if (envOk) {
    log('🎉 Configuration .env valide!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Configuration .env incomplète. Vérifiez les erreurs ci-dessus.', 'yellow');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { checkEnvFile, checkProjectStructure };
