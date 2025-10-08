const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Vérification du schéma de base de données...\n');
    
    // Vérifier crops table
    console.log('📊 Table CROPS:');
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log('❌ Erreur crops table:', error.message);
      } else if (data && data.length > 0) {
        const sampleRow = data[0];
        console.log('   Colonnes disponibles:');
        Object.keys(sampleRow).forEach(col => {
          console.log(`   - ${col}: ${typeof sampleRow[col]}`);
        });
      } else {
        console.log('   ⚠️ Table crops vide ou inaccessible');
      }
      
      // Test des colonnes communes susceptible de causer erreur
      const cropTestColumns = ['parcel_id', 'plot_id', 'farm_file_plot_id', 'id'];
      for (const col of cropTestColumns) {
        try {
          const { error: testError } = await supabase.from('crops').select(col).limit(1);
          if (testError && testError.code !== 'PGRST116') {
            console.log(`   ❌ Colonne crops.${col}: N'EXISTE PAS`);
          } else {
            console.log(`   ✅ Colonne crops.${col}: EXISTE`);
          }
        } catch (err) {
          console.log(`   ❌ Colonne crops.${col}: ERREUR`);
        }
      }
    } catch (err) {
      console.log('❌ Erreur lors de l\'accès à crops:', err.message);
    }
    
    console.log('\n📊 Table OPERATIONS:');
    try {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log('❌ Erreur operations table:', error.message);
      } else if (data && data.length > 0) {
        const sampleRow = data[0];
        console.log('   Colonnes disponibles:');
        Object.keys(sampleRow).forEach(col => {
          console.log(`   - ${col}: ${typeof sampleRow[col]}`);
        });
      } else {
        console.log('   ⚠️ Table operations vide ou inaccessible');
      }
      
      // Test des colonnes communes
      const opsTestColumns = ['parcel_id', 'plot_id', 'farm_file_plot_id', 'operation_date'];
      for (const col of opsTestColumns) {
        try {
          const { error: testError } = await supabase.from('operations').select(col).limit(1);
          if (testError && testError.code !== 'PGRST116') {
            console.log(`   ❌ Colonne operations.${col}: N'EXISTE PAS`);
          } else {
            console.log(`   ✅ Colonne operations.${col}: EXISTE`);
          }
        } catch (err) {
          console.log(`   ❌ Colonne operations.${col}: ERREUR`);
        }
      }
    } catch (err) {
      console.log('❌ Erreur lors de l\'accès à operations:', err.message);
    }
    
    console.log('\n📊 Table OBSERVATIONS:');
    try {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log('❌ Erreur observations table:', error.message);
      } else if (data && data.length > 0) {
        const sampleRow = data[0];
        console.log('   Colonnes disponibles:');
        Object.keys(sampleRow).forEach(col => {
          console.log(`   - ${col}: ${typeof sampleRow[col]}`);
        });
      } else {
        console.log('   ⚠️ Table observations vide ou inaccessible');
      }
      
      // Test des colonnes communes
      const obsTestColumns = ['parcel_id', 'plot_id', 'farm_file_plot_id'];
      for (const col of obsTestColumns) {
        try {
          const { error: testError } = await supabase.from('observations').select(col).limit(1);
          if (testError && testError.code !== 'PGRST116') {
            console.log(`   ❌ Colonne observations.${col}: N'EXISTE PAS`);
          } else {
            console.log(`   ✅ Colonne observations.${col}: EXISTE`);
          }
        } catch (err) {
          console.log(`   ❌ Colonne observations.${col}: ERREUR`);
        }
      }
    } catch (err) {
      console.log('❌ Erreur lors de l\'accès à observations:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkDatabaseSchema();
