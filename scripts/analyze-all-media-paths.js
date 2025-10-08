#!/usr/bin/env node

/**
 * Script d'analyse de tous les chemins de fichiers media
 * Identifie les problèmes de chemins et URLs
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

// Analyser tous les chemins de fichiers media
async function analyzeAllMediaPaths() {
  log('\n🔍 Analyse Complète des Chemins Media', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Récupérer tous les médias
    log('\n📋 Récupération de tous les médias...', 'blue');
    
    const { data: allMedia, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaError) {
      log(`❌ Erreur récupération médias: ${mediaError.message}`, 'red');
      return false;
    }

    if (!allMedia || allMedia.length === 0) {
      log('❌ Aucun média trouvé', 'red');
      return false;
    }

    log(`✅ ${allMedia.length} média(s) trouvé(s)`, 'green');

    // 2. Analyser chaque média
    log('\n📊 Analyse détaillée des médias:', 'blue');
    
    let correctPaths = 0;
    let incorrectPaths = 0;
    let accessibleFiles = 0;
    let inaccessibleFiles = 0;

    for (const media of allMedia) {
      log(`\n🔍 Média: ${media.file_name}`, 'blue');
      log(`   ID: ${media.id}`, 'blue');
      log(`   Entity: ${media.entity_type}/${media.entity_id}`, 'blue');
      log(`   Chemin: ${media.file_path}`, 'blue');
      log(`   Taille: ${media.file_size_bytes} bytes`, 'blue');
      log(`   Type: ${media.mime_type}`, 'blue');

      // Vérifier le format du chemin
      const hasDoubleMedia = media.file_path.includes('media/media/');
      const hasCorrectFormat = media.file_path.match(/^media\/[a-f0-9-]+\/[a-z]+\/[a-f0-9-]+\/[a-z_]+_[a-f0-9-]+_\d+\.(jpg|jpeg|png|gif)$/i);

      if (hasDoubleMedia) {
        log(`   ❌ Chemin incorrect: contient "media/media/"`, 'red');
        incorrectPaths++;
      } else if (hasCorrectFormat) {
        log(`   ✅ Format de chemin correct`, 'green');
        correctPaths++;
      } else {
        log(`   ⚠️  Format de chemin suspect`, 'yellow');
        incorrectPaths++;
      }

      // Vérifier l'accessibilité du fichier
      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('media')
          .download(media.file_path);

        if (fileError) {
          log(`   ❌ Fichier inaccessible: ${fileError.message}`, 'red');
          inaccessibleFiles++;
        } else {
          log(`   ✅ Fichier accessible`, 'green');
          accessibleFiles++;
        }
      } catch (error) {
        log(`   ❌ Erreur vérification fichier: ${error.message}`, 'red');
        inaccessibleFiles++;
      }

      // Générer l'URL publique
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(media.file_path);

      log(`   URL publique: ${urlData.publicUrl}`, 'blue');
    }

    // 3. Résumé de l'analyse
    log('\n📊 Résumé de l\'analyse:', 'blue');
    log(`   ✅ Chemins corrects: ${correctPaths}`, 'green');
    log(`   ❌ Chemins incorrects: ${incorrectPaths}`, 'red');
    log(`   ✅ Fichiers accessibles: ${accessibleFiles}`, 'green');
    log(`   ❌ Fichiers inaccessibles: ${inaccessibleFiles}`, 'red');

    // 4. Identifier les problèmes spécifiques
    if (incorrectPaths > 0) {
      log('\n🔧 Problèmes identifiés:', 'yellow');
      
      const problematicMedia = allMedia.filter(media => 
        media.file_path.includes('media/media/') || 
        !media.file_path.match(/^media\/[a-f0-9-]+\/[a-z]+\/[a-f0-9-]+\/[a-z_]+_[a-f0-9-]+_\d+\.(jpg|jpeg|png|gif)$/i)
      );

      problematicMedia.forEach((media, index) => {
        log(`   ${index + 1}. ${media.file_name}`, 'yellow');
        log(`      Chemin: ${media.file_path}`, 'yellow');
        log(`      Problème: ${media.file_path.includes('media/media/') ? 'Double "media/"' : 'Format incorrect'}`, 'yellow');
      });
    }

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Analyse Chemins Media', 'bright');
  log('='.repeat(60), 'bright');

  const success = await analyzeAllMediaPaths();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Analyse terminée!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs lors de l\'analyse.', 'red');
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

module.exports = { analyzeAllMediaPaths };
