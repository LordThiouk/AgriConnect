#!/usr/bin/env node

/**
 * Script pour corriger les chemins de fichiers media incorrects
 * Corrige les chemins avec double "media/media/" vers "media/"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
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

// Corriger les chemins de fichiers media
async function fixMediaFilePaths() {
  log('\n🔧 Correction des Chemins de Fichiers Media', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Trouver tous les médias avec des chemins incorrects
    log('\n🔍 Recherche des médias avec chemins incorrects...', 'blue');
    
    const { data: incorrectMedia, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .like('file_path', 'media/media/%');

    if (mediaError) {
      log(`❌ Erreur récupération médias: ${mediaError.message}`, 'red');
      return false;
    }

    if (!incorrectMedia || incorrectMedia.length === 0) {
      log('✅ Aucun média avec chemin incorrect trouvé', 'green');
      return true;
    }

    log(`✅ ${incorrectMedia.length} média(s) avec chemin incorrect trouvé(s)`, 'green');

    // 2. Afficher les médias à corriger
    log('\n📋 Médias à corriger:', 'blue');
    incorrectMedia.forEach((media, index) => {
      log(`   ${index + 1}. ${media.file_name}`, 'blue');
      log(`      Chemin actuel: ${media.file_path}`, 'yellow');
      log(`      Entity: ${media.entity_type}/${media.entity_id}`, 'blue');
    });

    // 3. Corriger chaque média
    log('\n🔧 Correction des chemins...', 'blue');
    
    let correctedCount = 0;
    let errorCount = 0;

    for (const media of incorrectMedia) {
      try {
        // Corriger le chemin en supprimant le double "media/"
        const correctedPath = media.file_path.replace('media/media/', 'media/');
        
        log(`\n   Correction: ${media.file_name}`, 'blue');
        log(`   Ancien: ${media.file_path}`, 'yellow');
        log(`   Nouveau: ${correctedPath}`, 'green');

        // Vérifier que le fichier existe dans le Storage avec le nouveau chemin
        const { data: fileExists, error: checkError } = await supabase.storage
          .from('media')
          .download(correctedPath);

        if (checkError) {
          log(`   ⚠️  Fichier non trouvé avec le nouveau chemin: ${checkError.message}`, 'yellow');
          
          // Essayer de vérifier avec l'ancien chemin
          const { data: oldFileExists, error: oldCheckError } = await supabase.storage
            .from('media')
            .download(media.file_path);

          if (oldCheckError) {
            log(`   ❌ Fichier non trouvé non plus avec l'ancien chemin: ${oldCheckError.message}`, 'red');
            errorCount++;
            continue;
          } else {
            log(`   ✅ Fichier trouvé avec l'ancien chemin, correction possible`, 'green');
          }
        } else {
          log(`   ✅ Fichier trouvé avec le nouveau chemin`, 'green');
        }

        // Mettre à jour le chemin dans la base de données
        const { error: updateError } = await supabase
          .from('media')
          .update({ file_path: correctedPath })
          .eq('id', media.id);

        if (updateError) {
          log(`   ❌ Erreur mise à jour: ${updateError.message}`, 'red');
          errorCount++;
        } else {
          log(`   ✅ Chemin corrigé avec succès`, 'green');
          correctedCount++;
        }

      } catch (error) {
        log(`   ❌ Erreur traitement: ${error.message}`, 'red');
        errorCount++;
      }
    }

    // 4. Résumé des corrections
    log('\n📊 Résumé des corrections:', 'blue');
    log(`   ✅ Médias corrigés: ${correctedCount}`, 'green');
    log(`   ❌ Erreurs: ${errorCount}`, errorCount > 0 ? 'red' : 'green');
    log(`   📋 Total traité: ${incorrectMedia.length}`, 'blue');

    // 5. Vérification finale
    if (correctedCount > 0) {
      log('\n✅ Vérification finale...', 'blue');
      
      const { data: finalCheck, error: finalError } = await supabase
        .from('media')
        .select('id, file_name, file_path')
        .like('file_path', 'media/media/%');

      if (finalError) {
        log(`❌ Erreur vérification finale: ${finalError.message}`, 'red');
      } else if (!finalCheck || finalCheck.length === 0) {
        log('✅ Tous les chemins ont été corrigés!', 'green');
      } else {
        log(`⚠️  ${finalCheck.length} média(s) avec chemin incorrect restant(s)`, 'yellow');
      }
    }

    return correctedCount > 0 || errorCount === 0;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Correction Chemins Media', 'bright');
  log('='.repeat(60), 'bright');

  const success = await fixMediaFilePaths();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Correction terminée!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs lors de la correction.', 'red');
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

module.exports = { fixMediaFilePaths };
