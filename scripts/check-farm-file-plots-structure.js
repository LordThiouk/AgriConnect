const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFarmFilePlotsStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table farm_file_plots...');
    
    // Vérifier la structure de la table farm_file_plots
    const { data, error } = await supabase
      .from('farm_file_plots')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Colonnes disponibles dans farm_file_plots:');
      const sampleRow = data[0];
      Object.keys(sampleRow).forEach(column => {
        console.log(`   - ${column}: ${typeof sampleRow[column]}`);
      });
    } else {
      console.log('⚠️ Aucune donnée trouvée dans farm_file_plots');
    }
    
    // Test d'une requête spécifique pour voir quelles colonnes existent
    console.log('\n🔍 Test des colonnes spécifiques...');
    
    const testColumns = ['variety', 'cotton_variety', 'soil_type', 'water_source', 'status', 'area_hectares'];
    
    for (const column of testColumns) {
      try {
        const { data: testData, error: testError } = await supabase
          .from('farm_file_plots')
          .select(column)
          .limit(1);
        
        if (testError && testError.code !== 'PGRST116') {
          console.log(`   ❌ Colonne "${column}": N'EXISTE PAS`);
        } else {
          console.log(`   ✅ Colonne "${column}": EXISTE`);
        }
      } catch (err) {
        console.log(`   ❌ Colonne "${column}": ERREUR - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkFarmFilePlotsStructure();
