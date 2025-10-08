#!/usr/bin/env node

/**
 * Script de vérification des photos d'observations
 * Vérifie la cohérence entre observations et médias
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

// Vérifier les photos d'observations
async function checkObservationPhotos() {
  log('\n🔍 Vérification Photos d\'Observations', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Récupérer toutes les observations récentes
    log('\n📋 Récupération des observations récentes...', 'blue');
    
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('id, observation_type, description, observation_date, plot_id')
      .order('observation_date', { ascending: false })
      .limit(10);

    if (obsError) {
      log(`❌ Erreur récupération observations: ${obsError.message}`, 'red');
      return false;
    }

    if (!observations || observations.length === 0) {
      log('❌ Aucune observation trouvée', 'red');
      return false;
    }

    log(`✅ ${observations.length} observations trouvées`, 'green');

    // 2. Vérifier les médias pour chaque observation
    log('\n📸 Vérification des médias par observation...', 'blue');
    
    for (const obs of observations) {
      log(`\n🔍 Observation: ${obs.observation_type} (${obs.id})`, 'blue');
      log(`   Description: ${obs.description}`, 'blue');
      log(`   Date: ${obs.observation_date}`, 'blue');
      
      // Récupérer les médias pour cette observation
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('entity_type', 'observation')
        .eq('entity_id', obs.id);

      if (mediaError) {
        log(`   ❌ Erreur récupération médias: ${mediaError.message}`, 'red');
        continue;
      }

      if (media && media.length > 0) {
        log(`   ✅ ${media.length} photo(s) trouvée(s):`, 'green');
        media.forEach((m, index) => {
          log(`      ${index + 1}. ${m.file_name} (${m.file_path})`, 'green');
        });
      } else {
        log(`   ⚠️  Aucune photo trouvée`, 'yellow');
      }
    }

    // 3. Vérifier les médias orphelins (sans observation correspondante)
    log('\n🔍 Vérification des médias orphelins...', 'blue');
    
    const { data: allMedia, error: allMediaError } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', 'observation')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allMediaError) {
      log(`❌ Erreur récupération médias: ${allMediaError.message}`, 'red');
      return false;
    }

    if (allMedia && allMedia.length > 0) {
      log(`✅ ${allMedia.length} médias d'observations trouvés`, 'green');
      
      for (const media of allMedia) {
        // Vérifier si l'observation existe
        const { data: obsExists, error: obsExistsError } = await supabase
          .from('observations')
          .select('id')
          .eq('id', media.entity_id)
          .single();

        if (obsExistsError || !obsExists) {
          log(`   ⚠️  Média orphelin: ${media.file_name} (obs: ${media.entity_id})`, 'yellow');
        } else {
          log(`   ✅ Média valide: ${media.file_name} (obs: ${media.entity_id})`, 'green');
        }
      }
    } else {
      log('⚠️  Aucun média d\'observation trouvé', 'yellow');
    }

    // 4. Vérifier spécifiquement l'observation récente mentionnée dans les logs
    log('\n🎯 Vérification observation spécifique...', 'blue');
    
    const specificObsId = 'b4747995-cae5-4e5c-8429-b67291464e12';
    log(`   Recherche observation: ${specificObsId}`, 'blue');
    
    const { data: specificObs, error: specificObsError } = await supabase
      .from('observations')
      .select('*')
      .eq('id', specificObsId)
      .single();

    if (specificObsError || !specificObs) {
      log(`   ❌ Observation non trouvée: ${specificObsError?.message}`, 'red');
    } else {
      log(`   ✅ Observation trouvée: ${specificObs.observation_type} - ${specificObs.description}`, 'green');
      
      // Vérifier ses médias
      const { data: specificMedia, error: specificMediaError } = await supabase
        .from('media')
        .select('*')
        .eq('entity_type', 'observation')
        .eq('entity_id', specificObsId);

      if (specificMediaError) {
        log(`   ❌ Erreur récupération médias: ${specificMediaError.message}`, 'red');
      } else if (specificMedia && specificMedia.length > 0) {
        log(`   ✅ ${specificMedia.length} photo(s) trouvée(s) pour cette observation:`, 'green');
        specificMedia.forEach((m, index) => {
          log(`      ${index + 1}. ${m.file_name}`, 'green');
          log(`         Chemin: ${m.file_path}`, 'green');
          log(`         Créé: ${m.created_at}`, 'green');
        });
      } else {
        log(`   ⚠️  Aucune photo trouvée pour cette observation`, 'yellow');
      }
    }

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Vérification Photos Observations', 'bright');
  log('='.repeat(60), 'bright');

  const success = await checkObservationPhotos();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Vérification terminée!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs détectées.', 'red');
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

module.exports = { checkObservationPhotos };
