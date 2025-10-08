/**
 * Script pour vérifier les utilisateurs et rôles dans la base de données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseUsers() {
  console.log('🔍 === VÉRIFICATION DE LA BASE DE DONNÉES ===\n');

  try {
    // 1. Vérifier la table profiles
    console.log('📋 Table profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, region, department')
      .limit(10);

    if (profilesError) {
      console.error('❌ Erreur table profiles:', profilesError);
    } else {
      console.log(`✅ ${profiles.length} profils trouvés`);
      if (profils.length > 0) {
        console.log('   Exemples:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.full_name || 'N/A'} (${profile.role}) - ${profile.phone || 'N/A'}`);
        });
        
        // Compter les rôles
        const roles = {};
        profiles.forEach(profile => {
          roles[profile.role] = (roles[profile.role] || 0) + 1;
        });
        console.log('\n   Répartition des rôles:');
        Object.entries(roles).forEach(([role, count]) => {
          console.log(`   - ${role}: ${count}`);
        });
      }
    }

    // 2. Vérifier la table plots
    console.log('\n🏞️  Table plots:');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, name, area_hectares')
      .limit(5);

    if (plotsError) {
      console.error('❌ Erreur table plots:', plotsError);
    } else {
      console.log(`✅ ${plots.length} parcelles trouvées`);
      if (plots.length > 0) {
        console.log('   Exemples:');
        plots.forEach((plot, index) => {
          console.log(`   ${index + 1}. ${plot.name || 'Sans nom'} - ${plot.area_hectares || 'N/A'} ha`);
        });
      }
    }

    // 3. Vérifier la table crops
    console.log('\n🌾 Table crops:');
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('id, crop_type, variety, status')
      .limit(5);

    if (cropsError) {
      console.error('❌ Erreur table crops:', cropsError);
    } else {
      console.log(`✅ ${crops.length} cultures trouvées`);
      if (crops.length > 0) {
        console.log('   Exemples:');
        crops.forEach((crop, index) => {
          console.log(`   ${index + 1}. ${crop.crop_type || 'N/A'} - ${crop.variety || 'N/A'} (${crop.status})`);
        });
      }
    }

    // 4. Vérifier la table operations
    console.log('\n🔧 Table operations:');
    const { data: operations, error: operationsError } = await supabase
      .from('operations')
      .select('id, operation_type, operation_date, status')
      .limit(5);

    if (operationsError) {
      console.error('❌ Erreur table operations:', operationsError);
    } else {
      console.log(`✅ ${operations.length} opérations trouvées`);
      if (operations.length > 0) {
        console.log('   Exemples:');
        operations.forEach((operation, index) => {
          console.log(`   ${index + 1}. ${operation.operation_type || 'N/A'} - ${operation.operation_date || 'N/A'} (${operation.status})`);
        });
      }
    }

    // 5. Vérifier la table observations
    console.log('\n👁️  Table observations:');
    const { data: observations, error: observationsError } = await supabase
      .from('observations')
      .select('id, observation_type, observation_date, severity')
      .limit(5);

    if (observationsError) {
      console.error('❌ Erreur table observations:', observationsError);
    } else {
      console.log(`✅ ${observations.length} observations trouvées`);
      if (observations.length > 0) {
        console.log('   Exemples:');
        observations.forEach((observation, index) => {
          console.log(`   ${index + 1}. ${observation.observation_type || 'N/A'} - ${observation.observation_date || 'N/A'} (gravité: ${observation.severity})`);
        });
      }
    }

    // 6. Vérifier la table visits
    console.log('\n🗓️  Table visits:');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, visit_type, visit_date, status')
      .limit(5);

    if (visitsError) {
      console.error('❌ Erreur table visits:', visitsError);
    } else {
      console.log(`✅ ${visits.length} visites trouvées`);
      if (visits.length > 0) {
        console.log('   Exemples:');
        visits.forEach((visit, index) => {
          console.log(`   ${index + 1}. ${visit.visit_type || 'N/A'} - ${visit.visit_date || 'N/A'} (${visit.status})`);
        });
      }
    }

    // 7. Vérifier la table media
    console.log('\n📸 Table media:');
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('id, media_type, entity_type, entity_id')
      .limit(5);

    if (mediaError) {
      console.error('❌ Erreur table media:', mediaError);
    } else {
      console.log(`✅ ${media.length} médias trouvés`);
      if (media.length > 0) {
        console.log('   Exemples:');
        media.forEach((mediaItem, index) => {
          console.log(`   ${index + 1}. ${mediaItem.media_type || 'N/A'} - ${mediaItem.entity_type}:${mediaItem.entity_id}`);
        });
      }
    }

    // 8. Vérifier la table farm_files
    console.log('\n📁 Table farm_files:');
    const { data: farmFiles, error: farmFilesError } = await supabase
      .from('farm_files')
      .select('id, name, phone, status')
      .limit(5);

    if (farmFilesError) {
      console.error('❌ Erreur table farm_files:', farmFilesError);
    } else {
      console.log(`✅ ${farmFiles.length} fiches producteur trouvées`);
      if (farmFiles.length > 0) {
        console.log('   Exemples:');
        farmFiles.forEach((farmFile, index) => {
          console.log(`   ${index + 1}. ${farmFile.name || 'N/A'} - ${farmFile.phone || 'N/A'} (${farmFile.status})`);
        });
      }
    }

    // 9. Vérifier les RPC disponibles
    console.log('\n🔧 === VÉRIFICATION DES RPC DISPONIBLES ===');
    const rpcFunctions = [
      'get_agent_plots_with_geolocation',
      'get_crops_by_plot_id',
      'get_latest_operations',
      'get_observations_for_plot',
      'get_agent_all_visits_with_filters',
      'get_media_by_entity'
    ];

    for (const rpcFunction of rpcFunctions) {
      try {
        // Test simple avec des paramètres vides pour voir si la fonction existe
        const { error } = await supabase.rpc(rpcFunction, {});
        if (error && error.code === 'PGRST202') {
          console.log(`❌ ${rpcFunction}: Fonction non trouvée`);
        } else if (error && error.code !== 'PGRST202') {
          console.log(`✅ ${rpcFunction}: Fonction trouvée (erreur paramètres attendue)`);
        } else {
          console.log(`✅ ${rpcFunction}: Fonction trouvée`);
        }
      } catch (err) {
        console.log(`❌ ${rpcFunction}: Erreur de test`);
      }
    }

    console.log('\n📊 === RÉSUMÉ ===');
    console.log(`Profils: ${profiles?.length || 0}`);
    console.log(`Parcelles: ${plots?.length || 0}`);
    console.log(`Cultures: ${crops?.length || 0}`);
    console.log(`Opérations: ${operations?.length || 0}`);
    console.log(`Observations: ${observations?.length || 0}`);
    console.log(`Visites: ${visits?.length || 0}`);
    console.log(`Médias: ${media?.length || 0}`);
    console.log(`Fiches producteur: ${farmFiles?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

checkDatabaseUsers()
  .then(() => {
    console.log('\n🏁 Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
