#!/usr/bin/env node

/**
 * Script pour corriger les médias orphelins
 * Associe les photos aux bonnes observations
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

// Corriger les médias orphelins
async function fixOrphanedMedia() {
  log('\n🔧 Correction des Médias Orphelins', 'cyan');
  log('='.repeat(50), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Trouver le média orphelin
    log('\n🔍 Recherche du média orphelin...', 'blue');
    
    const orphanedMediaId = '68a483a3-3ef6-4ade-add6-828b1b6be1e3'; // ID du média orphelin
    const { data: orphanedMedia, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .eq('id', orphanedMediaId)
      .single();

    if (mediaError || !orphanedMedia) {
      log(`❌ Média orphelin non trouvé: ${mediaError?.message}`, 'red');
      return false;
    }

    log(`✅ Média orphelin trouvé: ${orphanedMedia.file_name}`, 'green');
    log(`   Entity ID actuel: ${orphanedMedia.entity_id}`, 'yellow');
    log(`   Entity Type: ${orphanedMedia.entity_type}`, 'yellow');

    // 2. Trouver l'observation récente correspondante
    log('\n🔍 Recherche de l\'observation correspondante...', 'blue');
    
    const { data: recentObservations, error: obsError } = await supabase
      .from('observations')
      .select('*')
      .eq('plot_id', orphanedMedia.entity_id) // Même parcelle
      .order('created_at', { ascending: false })
      .limit(5);

    if (obsError) {
      log(`❌ Erreur récupération observations: ${obsError.message}`, 'red');
      return false;
    }

    if (!recentObservations || recentObservations.length === 0) {
      log('❌ Aucune observation trouvée pour cette parcelle', 'red');
      return false;
    }

    log(`✅ ${recentObservations.length} observations trouvées pour cette parcelle`, 'green');
    
    // Afficher les observations
    recentObservations.forEach((obs, index) => {
      log(`   ${index + 1}. ${obs.observation_type} - ${obs.description} (${obs.id})`, 'blue');
      log(`      Créée: ${obs.created_at}`, 'blue');
    });

    // 3. Trouver l'observation la plus récente (probablement celle avec la photo)
    const targetObservation = recentObservations[0];
    log(`\n🎯 Observation cible: ${targetObservation.observation_type} (${targetObservation.id})`, 'green');

    // 4. Vérifier si cette observation a déjà des photos
    log('\n📸 Vérification photos existantes...', 'blue');
    
    const { data: existingPhotos, error: photosError } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', 'observation')
      .eq('entity_id', targetObservation.id);

    if (photosError) {
      log(`❌ Erreur vérification photos: ${photosError.message}`, 'red');
      return false;
    }

    if (existingPhotos && existingPhotos.length > 0) {
      log(`⚠️  Cette observation a déjà ${existingPhotos.length} photo(s)`, 'yellow');
    } else {
      log('✅ Cette observation n\'a pas encore de photos', 'green');
    }

    // 5. Corriger l'association
    log('\n🔧 Correction de l\'association...', 'blue');
    
    const { error: updateError } = await supabase
      .from('media')
      .update({ 
        entity_id: targetObservation.id,
        entity_type: 'observation'
      })
      .eq('id', orphanedMediaId);

    if (updateError) {
      log(`❌ Erreur correction: ${updateError.message}`, 'red');
      return false;
    }

    log('✅ Association corrigée avec succès!', 'green');

    // 6. Vérifier la correction
    log('\n✅ Vérification de la correction...', 'blue');
    
    const { data: correctedMedia, error: verifyError } = await supabase
      .from('media')
      .select('*')
      .eq('id', orphanedMediaId)
      .single();

    if (verifyError) {
      log(`❌ Erreur vérification: ${verifyError.message}`, 'red');
      return false;
    }

    log(`✅ Média corrigé:`, 'green');
    log(`   Entity ID: ${correctedMedia.entity_id}`, 'green');
    log(`   Entity Type: ${correctedMedia.entity_type}`, 'green');
    log(`   File Name: ${correctedMedia.file_name}`, 'green');

    // 7. Vérifier que l'observation a maintenant des photos
    const { data: finalPhotos, error: finalPhotosError } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', 'observation')
      .eq('entity_id', targetObservation.id);

    if (finalPhotosError) {
      log(`❌ Erreur vérification finale: ${finalPhotosError.message}`, 'red');
      return false;
    }

    log(`✅ L'observation a maintenant ${finalPhotos.length} photo(s)`, 'green');

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Correction Médias Orphelins', 'bright');
  log('='.repeat(60), 'bright');

  const success = await fixOrphanedMedia();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Correction terminée avec succès!', 'green');
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

module.exports = { fixOrphanedMedia };
