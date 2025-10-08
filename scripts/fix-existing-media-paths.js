#!/usr/bin/env node

/**
 * Script pour corriger les chemins des médias existants
 * Supprime le préfixe "media/" des file_path pour éviter le double "media/media/"
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

// Corriger les chemins des médias existants
async function fixExistingMediaPaths() {
  log('\n🔧 Correction des Chemins des Médias Existants', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Récupérer tous les médias avec des chemins commençant par "media/"
    log('\n🔍 Recherche des médias à corriger...', 'blue');
    
    const { data: mediaToFix, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .like('file_path', 'media/%');

    if (mediaError) {
      log(`❌ Erreur récupération médias: ${mediaError.message}`, 'red');
      return false;
    }

    if (!mediaToFix || mediaToFix.length === 0) {
      log('✅ Aucun média à corriger trouvé', 'green');
      return true;
    }

    log(`✅ ${mediaToFix.length} média(s) à corriger trouvé(s)`, 'green');

    // 2. Afficher les médias à corriger
    log('\n📋 Médias à corriger:', 'blue');
    mediaToFix.forEach((media, index) => {
      log(`   ${index + 1}. ${media.file_name}`, 'blue');
      log(`      Chemin actuel: ${media.file_path}`, 'yellow');
    });

    // 3. Corriger chaque média
    log('\n🔧 Correction des chemins...', 'blue');
    
    let correctedCount = 0;
    let errorCount = 0;

    for (const media of mediaToFix) {
      try {
        // Supprimer le préfixe "media/" du chemin
        const correctedPath = media.file_path.replace(/^media\//, '');
        
        log(`\n   Correction: ${media.file_name}`, 'blue');
        log(`   Ancien: ${media.file_path}`, 'yellow');
        log(`   Nouveau: ${correctedPath}`, 'green');

        // Vérifier que le fichier existe dans le Storage avec le nouveau chemin
        const { data: fileExists, error: checkError } = await supabase.storage
          .from('media')
          .download(correctedPath);

        if (checkError) {
          log(`   ❌ Fichier non trouvé avec le nouveau chemin: ${checkError.message}`, 'red');
          errorCount++;
          continue;
        }

        log(`   ✅ Fichier trouvé avec le nouveau chemin`, 'green');

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
    log(`   📋 Total traité: ${mediaToFix.length}`, 'blue');

    // 5. Vérification finale
    if (correctedCount > 0) {
      log('\n✅ Vérification finale...', 'blue');
      
      // Vérifier que les URLs publiques sont maintenant correctes
      const { data: correctedMedia, error: finalError } = await supabase
        .from('media')
        .select('id, file_name, file_path')
        .limit(1);

      if (finalError) {
        log(`❌ Erreur vérification finale: ${finalError.message}`, 'red');
      } else if (correctedMedia && correctedMedia.length > 0) {
        const testMedia = correctedMedia[0];
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(testMedia.file_path);
        
        log(`✅ Test URL publique:`, 'green');
        log(`   Chemin BDD: ${testMedia.file_path}`, 'green');
        log(`   URL générée: ${urlData.publicUrl}`, 'green');
        
        // Vérifier qu'il n'y a plus de double "media/"
        if (urlData.publicUrl.includes('media/media/')) {
          log(`   ❌ URL contient encore "media/media/"`, 'red');
        } else {
          log(`   ✅ URL correcte (pas de double "media/")`, 'green');
        }
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
  log('🚀 AgriConnect - Correction Chemins Médias Existants', 'bright');
  log('='.repeat(60), 'bright');

  const success = await fixExistingMediaPaths();

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

module.exports = { fixExistingMediaPaths };
