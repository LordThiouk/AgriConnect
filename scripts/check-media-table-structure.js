#!/usr/bin/env node

/**
 * Script de vérification de la structure de la table media
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

// Vérifier la structure de la table media
async function checkMediaTableStructure() {
  log('\n🔍 Vérification Structure Table Media', 'cyan');
  log('='.repeat(50), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Vérifier les utilisateurs disponibles
    log('\n👥 Utilisateurs disponibles:', 'blue');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .limit(10);

    if (profilesError) {
      log(`❌ Erreur récupération profiles: ${profilesError.message}`, 'red');
      return false;
    }

    if (!profiles || profiles.length === 0) {
      log('❌ Aucun profil trouvé', 'red');
      return false;
    }

    log(`✅ ${profiles.length} profils trouvés:`, 'green');
    profiles.forEach((profile, index) => {
      log(`   ${index + 1}. ${profile.display_name} (${profile.id}) - ${profile.role}`, 'green');
    });

    // 2. Vérifier les parcelles disponibles
    log('\n🌾 Parcelles disponibles:', 'blue');
    
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, name, producer_id')
      .limit(5);

    if (plotsError) {
      log(`❌ Erreur récupération plots: ${plotsError.message}`, 'red');
    } else if (plots && plots.length > 0) {
      log(`✅ ${plots.length} parcelles trouvées:`, 'green');
      plots.forEach((plot, index) => {
        log(`   ${index + 1}. ${plot.name} (${plot.id}) - Producer: ${plot.producer_id}`, 'green');
      });
    } else {
      log('⚠️  Aucune parcelle trouvée', 'yellow');
    }

    // 3. Vérifier les observations disponibles
    log('\n👁️  Observations disponibles:', 'blue');
    
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('id, observation_type, plot_id')
      .limit(5);

    if (obsError) {
      log(`❌ Erreur récupération observations: ${obsError.message}`, 'red');
    } else if (observations && observations.length > 0) {
      log(`✅ ${observations.length} observations trouvées:`, 'green');
      observations.forEach((obs, index) => {
        log(`   ${index + 1}. ${obs.observation_type} (${obs.id}) - Plot: ${obs.plot_id}`, 'green');
      });
    } else {
      log('⚠️  Aucune observation trouvée', 'yellow');
    }

    // 4. Tester l'insertion avec des données valides
    log('\n🧪 Test insertion avec données valides:', 'blue');
    
    if (profiles.length > 0 && plots.length > 0) {
      const testProfile = profiles[0];
      const testPlot = plots[0];
      
      log(`   Utilisateur: ${testProfile.display_name} (${testProfile.id})`, 'blue');
      log(`   Parcelle: ${testPlot.name} (${testPlot.id})`, 'blue');
      
      // Tester l'insertion
      const { data: testInsert, error: insertError } = await supabase
        .from('media')
        .insert({
          owner_profile_id: testProfile.id,
          entity_type: 'plot',
          entity_id: testPlot.id,
          file_path: 'test/path/test.png',
          file_name: 'test.png',
          mime_type: 'image/png',
          file_size_bytes: 1024,
          description: 'Test insertion'
        })
        .select()
        .single();

      if (insertError) {
        log(`❌ Erreur insertion test: ${insertError.message}`, 'red');
        log(`   Code: ${insertError.code}`, 'red');
        log(`   Details: ${insertError.details}`, 'red');
        log(`   Hint: ${insertError.hint}`, 'red');
      } else {
        log(`✅ Insertion test réussie: ${testInsert.id}`, 'green');
        
        // Nettoyer le test
        await supabase
          .from('media')
          .delete()
          .eq('id', testInsert.id);
        log('🗑️  Test nettoyé', 'yellow');
      }
    } else {
      log('⚠️  Données insuffisantes pour le test', 'yellow');
    }

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Vérification Structure Media', 'bright');
  log('='.repeat(60), 'bright');

  const success = await checkMediaTableStructure();

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

module.exports = { checkMediaTableStructure };
