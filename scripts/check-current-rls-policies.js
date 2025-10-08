const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser service role pour voir les politiques

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRLSPolicies() {
  console.log('🔒 Analyse des politiques RLS actuelles...\n');

  // Tables à vérifier
  const tablesToCheck = ['inputs', 'operations', 'observations', 'crops', 'visits', 'participants'];

  for (const table of tablesToCheck) {
    console.log(`📋 Table ${table.toUpperCase()}:`);
    
    try {
      // Récupérer toutes les politiques en lecture directe PostgreSQL
      const { data: policies, error } = await supabase.rpc('get_table_policies', { table_name: table });
      
      if (error) {
        console.log(`   ⚠️ Erreur pour ${table}:`, error.message);
      } else if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   🔐 Policy: ${policy.policyname}`);
          console.log(`      - Type: ${policy.cmd}`);
          console.log(`      - Roles: ${policy.roles}`);
          console.log(`      - Qual: ${policy.qual ? policy.qual.substring(0, 100) + '...' : 'Aucune condition'}`);
          console.log(`      - With Check: ${policy.with_check ? policy.with_check.substring(0, 100) + '...' : 'Aucune condition'}`);
        });
      } else {
        console.log(`   ❌ Aucune politique RLS trouvée pour ${table}`);
      }
    } catch (err) {
      console.log(`   ❌ Erreur lors de la récupération des politiques pour ${table}:`, err.message);
    }
    console.log('');
  }
}

// Créer une fonction helper pour récupérer les politiques
async function setupRLSHelper() {
  try {
    // Créer une fonction SQL pour récupérer les politiques
    await supabase.rpc('create_get_policies_function');
    console.log('✅ Fonction helper créée');
  } catch (err) {
    console.log('ℹ️ Fonction helper peut-être déjà existante');
  }
}

async function checkTableAccess() {
  console.log('\n🧪 Test d\'accès aux tables...');
  
  try {
    // Test lecture pour différentes tables
    const tables = ['inputs', 'operations', 'observations'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Lecture OK`);
      }
    }
  } catch (err) {
    console.log('❌ Erreur dans le test d\'accès:', err.message);
  }
}

setupRLSHelper().then(() => {
  getRLSPolicies().then(() => {
    checkTableAccess().catch(console.error);
  }).catch(console.error);
}).catch(console.error);
