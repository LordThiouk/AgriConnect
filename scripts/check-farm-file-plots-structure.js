const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFarmFilePlotsStructure() {
  console.log('🔍 Vérification de la structure de la table farm_file_plots...\n');

  try {
    // 1. Vérifier la structure de farm_file_plots
    console.log('1️⃣ Structure de farm_file_plots:');
    const { data: farmFilePlots, error: farmFilePlotsError } = await supabase
      .from('farm_file_plots')
      .select('*')
      .limit(1);

    if (farmFilePlotsError) {
      console.error('❌ Erreur farm_file_plots:', farmFilePlotsError);
    } else {
      console.log('✅ Colonnes disponibles dans farm_file_plots:');
      if (farmFilePlots && farmFilePlots.length > 0) {
        console.log('   Colonnes:', Object.keys(farmFilePlots[0]));
      } else {
        console.log('   Aucune donnée dans farm_file_plots');
      }
    }

    // 2. Vérifier la structure de plots
    console.log('\n2️⃣ Structure de plots:');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .limit(1);

    if (plotsError) {
      console.error('❌ Erreur plots:', plotsError);
    } else {
      console.log('✅ Colonnes disponibles dans plots:');
      if (plots && plots.length > 0) {
        console.log('   Colonnes:', Object.keys(plots[0]));
      } else {
        console.log('   Aucune donnée dans plots');
      }
    }

    // 3. Vérifier s'il y a des données dans farm_file_plots
    console.log('\n3️⃣ Vérification des données:');
    const { count: farmFilePlotsCount, error: countError } = await supabase
      .from('farm_file_plots')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur count farm_file_plots:', countError);
    } else {
      console.log(`✅ Nombre d'enregistrements dans farm_file_plots: ${farmFilePlotsCount}`);
    }

    // 4. Vérifier s'il y a des données dans plots
    const { count: plotsCount, error: plotsCountError } = await supabase
      .from('plots')
      .select('*', { count: 'exact', head: true });

    if (plotsCountError) {
      console.error('❌ Erreur count plots:', plotsCountError);
    } else {
      console.log(`✅ Nombre d'enregistrements dans plots: ${plotsCount}`);
    }

    console.log('\n🎉 Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkFarmFilePlotsStructure();
