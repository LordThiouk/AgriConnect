require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTableTypes() {
  console.log('🔍 Vérification de tous les types de tables nécessaires...\n');

  try {
    // Check plots table schema
    console.log('📋 Table plots:');
    const { data: plotsData, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .limit(1);
    
    if (plotsError) {
      console.error('❌ Erreur plots:', plotsError);
    } else if (plotsData && plotsData.length > 0) {
      const sample = plotsData[0];
      console.log('Colonnes et types:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        console.log(`  ${key}: ${type} (valeur: ${value})`);
      });
    } else {
      console.log('  Aucune donnée trouvée');
    }

    // Check farm_file_plots table schema
    console.log('\n📋 Table farm_file_plots:');
    const { data: farmFilePlotsData, error: farmFilePlotsError } = await supabase
      .from('farm_file_plots')
      .select('*')
      .limit(1);
    
    if (farmFilePlotsError) {
      console.error('❌ Erreur farm_file_plots:', farmFilePlotsError);
    } else if (farmFilePlotsData && farmFilePlotsData.length > 0) {
      const sample = farmFilePlotsData[0];
      console.log('Colonnes et types:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        console.log(`  ${key}: ${type} (valeur: ${value})`);
      });
    } else {
      console.log('  Aucune donnée trouvée');
    }

    // Check profiles table schema
    console.log('\n📋 Table profiles:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError);
    } else if (profilesData && profilesData.length > 0) {
      const sample = profilesData[0];
      console.log('Colonnes et types:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        console.log(`  ${key}: ${type} (valeur: ${value})`);
      });
    } else {
      console.log('  Aucune donnée trouvée');
    }

    // Test PostGIS functions return types
    console.log('\n🗺️ Test des fonctions PostGIS:');
    const { data: postgisTest, error: postgisError } = await supabase
      .from('farm_file_plots')
      .select('id, geom, center_point')
      .not('geom', 'is', null)
      .limit(1);
    
    if (postgisError) {
      console.error('❌ Erreur test PostGIS:', postgisError);
    } else if (postgisTest && postgisTest.length > 0) {
      console.log('Données géométriques trouvées:', postgisTest[0]);
    } else {
      console.log('  Aucune donnée géométrique trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkAllTableTypes();
