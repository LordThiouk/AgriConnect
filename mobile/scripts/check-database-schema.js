/**
 * Script pour vérifier la structure réelle de la base de données
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

async function checkDatabaseSchema() {
  console.log('🔍 === VÉRIFICATION DE LA STRUCTURE DE LA BASE ===\n');

  try {
    // 1. Vérifier la table profiles (sans spécifier de colonnes)
    console.log('📋 Table profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (profilesError) {
      console.error('❌ Erreur table profiles:', profilesError);
    } else {
      console.log(`✅ ${profiles.length} profils trouvés`);
      if (profiles.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(profiles[0]));
        console.log('   Exemple:', profiles[0]);
      }
    }

    // 2. Vérifier la table plots
    console.log('\n🏞️  Table plots:');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .limit(3);

    if (plotsError) {
      console.error('❌ Erreur table plots:', plotsError);
    } else {
      console.log(`✅ ${plots.length} parcelles trouvées`);
      if (plots.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(plots[0]));
        console.log('   Exemple:', plots[0]);
      }
    }

    // 3. Vérifier la table crops
    console.log('\n🌾 Table crops:');
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('*')
      .limit(3);

    if (cropsError) {
      console.error('❌ Erreur table crops:', cropsError);
    } else {
      console.log(`✅ ${crops.length} cultures trouvées`);
      if (crops.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(crops[0]));
        console.log('   Exemple:', crops[0]);
      }
    }

    // 4. Vérifier la table operations
    console.log('\n🔧 Table operations:');
    const { data: operations, error: operationsError } = await supabase
      .from('operations')
      .select('*')
      .limit(3);

    if (operationsError) {
      console.error('❌ Erreur table operations:', operationsError);
    } else {
      console.log(`✅ ${operations.length} opérations trouvées`);
      if (operations.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(operations[0]));
        console.log('   Exemple:', operations[0]);
      }
    }

    // 5. Vérifier la table observations
    console.log('\n👁️  Table observations:');
    const { data: observations, error: observationsError } = await supabase
      .from('observations')
      .select('*')
      .limit(3);

    if (observationsError) {
      console.error('❌ Erreur table observations:', observationsError);
    } else {
      console.log(`✅ ${observations.length} observations trouvées`);
      if (observations.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(observations[0]));
        console.log('   Exemple:', observations[0]);
      }
    }

    // 6. Vérifier la table visits
    console.log('\n🗓️  Table visits:');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .limit(3);

    if (visitsError) {
      console.error('❌ Erreur table visits:', visitsError);
    } else {
      console.log(`✅ ${visits.length} visites trouvées`);
      if (visits.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(visits[0]));
        console.log('   Exemple:', visits[0]);
      }
    }

    // 7. Vérifier la table media
    console.log('\n📸 Table media:');
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .limit(3);

    if (mediaError) {
      console.error('❌ Erreur table media:', mediaError);
    } else {
      console.log(`✅ ${media.length} médias trouvés`);
      if (media.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(media[0]));
        console.log('   Exemple:', media[0]);
      }
    }

    // 8. Vérifier la table farm_files
    console.log('\n📁 Table farm_files:');
    const { data: farmFiles, error: farmFilesError } = await supabase
      .from('farm_files')
      .select('*')
      .limit(3);

    if (farmFilesError) {
      console.error('❌ Erreur table farm_files:', farmFilesError);
    } else {
      console.log(`✅ ${farmFiles.length} fiches producteur trouvées`);
      if (farmFiles.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(farmFiles[0]));
        console.log('   Exemple:', farmFiles[0]);
      }
    }

    // 9. Vérifier la table participants
    console.log('\n👥 Table participants:');
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(3);

    if (participantsError) {
      console.error('❌ Erreur table participants:', participantsError);
    } else {
      console.log(`✅ ${participants.length} participants trouvés`);
      if (participants.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(participants[0]));
        console.log('   Exemple:', participants[0]);
      }
    }

    // 10. Vérifier les tables disponibles
    console.log('\n📊 === RÉSUMÉ DES DONNÉES DISPONIBLES ===');
    const tables = [
      { name: 'profiles', data: profiles, error: profilesError },
      { name: 'plots', data: plots, error: plotsError },
      { name: 'crops', data: crops, error: cropsError },
      { name: 'operations', data: operations, error: operationsError },
      { name: 'observations', data: observations, error: observationsError },
      { name: 'visits', data: visits, error: visitsError },
      { name: 'media', data: media, error: mediaError },
      { name: 'farm_files', data: farmFiles, error: farmFilesError },
      { name: 'participants', data: participants, error: participantsError }
    ];

    tables.forEach(table => {
      if (table.error) {
        console.log(`❌ ${table.name}: Erreur - ${table.error.message}`);
      } else {
        console.log(`✅ ${table.name}: ${table.data.length} éléments`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

checkDatabaseSchema()
  .then(() => {
    console.log('\n🏁 Vérification de la structure terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
