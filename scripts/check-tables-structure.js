const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure(tableName, description) {
  console.log(`\n📊 Table ${tableName.toUpperCase()} (${description}):`);
  
  try {
    // 1. Structure de la table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Erreur lors de la récupération des données pour ${tableName}:`, error);
      return;
    }

    if (data && data.length > 0) {
      console.log('   📋 Colonnes disponibles:');
      const sampleRow = data[0];
      Object.keys(sampleRow).forEach(column => {
        console.log(`   - ${column}: ${typeof sampleRow[column]} ${sampleRow[column] !== null ? `= ${JSON.stringify(sampleRow[column])}` : '(null)'}`);
      });
    } else {
      console.log(`   ⚠️ Aucune donnée trouvée dans ${tableName}`);
    }

    // 2. Test spécifique des colonnes créateur/utilisateur
    const userColumns = ['created_by', 'performer_id', 'observed_by', 'agent_id', 'user_id'];
    
    console.log(`   🔍 Test des colonnes utilisateur pour ${tableName}:`);
    for (const column of userColumns) {
      try {
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select(column)
          .limit(1);

        if (testError) {
          if (testError.code === '42703') { // undefined_column
            console.log(`   ❌ Colonne ${tableName}.${column}: N'EXISTE PAS`);
          } else {
            console.log(`   ⚠️ Colonne ${tableName}.${column}: ERREUR - ${testError.message}`);
          }
        } else {
          console.log(`   ✅ Colonne ${tableName}.${column}: EXISTE`);
        }
      } catch (err) {
        console.log(`   ❌ Colonne ${tableName}.${column}: ERREUR - ${err.message}`);
      }
    }

  } catch (error) {
    console.error(`❌ Erreur générale pour la table ${tableName}:`, error);
  }
}

async function checkRlsPolicies() {
  console.log('\n🔒 Vérification des politiques RLS:');
  
  // Récupérer toutes les politiques RLS
  try {
    const { data, error } = await supabase.rpc('get_rls_policies');
    if (error) {
      console.log('   ⚠️ Impossible de vérifier les politiques RLS via Rpc');
    } else if (data) {
      console.log('   📋 Politiques RLS:', data);
    }
  } catch (err) {
    console.log('   ⚠️ Pas de fonction RPC pour les politiques RLS disponibles');
  }
}

async function checkTablesStructure() {
  console.log('🔍 Vérification du schéma des tables avec problèmes RLS...');

  await checkTableStructure('inputs', 'Table des intrants');
  await checkTableStructure('operations', 'Table des opérations agricoles');
  await checkTableStructure('observations', 'Table des observations terrain');
  await checkTableStructure('participants', 'Table des participants/intervenants (déjà corrigée)');
  await checkTableStructure('crops', 'Table des cultures');
  await checkTableStructure('visits', 'Table des visites');

  await checkRlsPolicies();
}

checkTablesStructure().catch(console.error);
