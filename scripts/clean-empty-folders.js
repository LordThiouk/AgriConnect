#!/usr/bin/env node

/**
 * Script de nettoyage des dossiers vides dans Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');
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

// Charger les variables d'environnement
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

// Initialiser le client Supabase
function initSupabase() {
  const env = loadEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

// Nettoyer les dossiers vides
async function cleanEmptyFolders() {
  log('\n🧹 Nettoyage des dossiers vides du Storage', 'cyan');
  log('='.repeat(50), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Lister tous les fichiers/dossiers
    const { data: allItems, error: listError } = await supabase.storage
      .from('media')
      .list('', {
        limit: 1000,
        offset: 0
      });

    if (listError) {
      log(`❌ Erreur listing: ${listError.message}`, 'red');
      return false;
    }

    log(`📁 ${allItems?.length || 0} éléments trouvés`, 'blue');

    // 2. Identifier les dossiers vides (sans extension)
    const emptyFolders = allItems?.filter(item => 
      !item.name.includes('.') && 
      item.metadata?.size === 0
    ) || [];

    log(`📂 ${emptyFolders.length} dossiers vides identifiés`, 'yellow');

    if (emptyFolders.length === 0) {
      log('✅ Aucun dossier vide à nettoyer', 'green');
      return true;
    }

    // 3. Supprimer les dossiers vides
    log('\n🗑️  Suppression des dossiers vides...', 'blue');
    
    for (const folder of emptyFolders) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove([folder.name]);

        if (deleteError) {
          log(`   ❌ Erreur suppression ${folder.name}: ${deleteError.message}`, 'red');
        } else {
          log(`   ✅ Supprimé: ${folder.name}`, 'green');
        }
      } catch (error) {
        log(`   ❌ Erreur ${folder.name}: ${error.message}`, 'red');
      }
    }

    // 4. Vérification finale
    log('\n🔍 Vérification finale...', 'blue');
    
    const { data: finalItems } = await supabase.storage
      .from('media')
      .list('', { limit: 1000 });

    const remainingEmptyFolders = finalItems?.filter(item => 
      !item.name.includes('.') && 
      item.metadata?.size === 0
    ) || [];

    if (remainingEmptyFolders.length === 0) {
      log('✅ Tous les dossiers vides ont été supprimés', 'green');
    } else {
      log(`⚠️  ${remainingEmptyFolders.length} dossiers vides restants`, 'yellow');
    }

    log(`📊 État final: ${finalItems?.length || 0} éléments dans le Storage`, 'blue');

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Nettoyage Dossiers Vides', 'bright');
  log('='.repeat(50), 'bright');

  const success = await cleanEmptyFolders();

  log('\n' + '='.repeat(50), 'bright');
  
  if (success) {
    log('🎉 Nettoyage terminé!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs lors du nettoyage.', 'red');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erreur fatale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { cleanEmptyFolders };
