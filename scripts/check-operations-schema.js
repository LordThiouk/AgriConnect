const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function checkOperationsSchema() {
  console.log('🔍 Vérification du schéma de la table operations...\n');

  try {
    // 1. Récupérer la structure de la table operations
    console.log('1️⃣ Structure de la table operations...');
    const { data: operations, error: operationsError } = await supabase
      .from('operations')
      .select('*')
      .limit(1);

    if (operationsError) {
      console.log('❌ Erreur lors de la récupération des operations:', operationsError.message);
      return;
    }

    if (operations && operations.length > 0) {
      console.log('✅ Colonnes de la table operations:');
      Object.keys(operations[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof operations[0][col]}`);
      });
    } else {
      console.log('⚠️  Aucune donnée dans la table operations');
    }

    // 2. Récupérer la structure de la table observations
    console.log('\n2️⃣ Structure de la table observations...');
    const { data: observations, error: observationsError } = await supabase
      .from('observations')
      .select('*')
      .limit(1);

    if (observationsError) {
      console.log('❌ Erreur lors de la récupération des observations:', observationsError.message);
      return;
    }

    if (observations && observations.length > 0) {
      console.log('✅ Colonnes de la table observations:');
      Object.keys(observations[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof observations[0][col]}`);
      });
    } else {
      console.log('⚠️  Aucune donnée dans la table observations');
    }

    // 3. Récupérer la structure de la table visits
    console.log('\n3️⃣ Structure de la table visits...');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .limit(1);

    if (visitsError) {
      console.log('❌ Erreur lors de la récupération des visits:', visitsError.message);
      return;
    }

    if (visits && visits.length > 0) {
      console.log('✅ Colonnes de la table visits:');
      Object.keys(visits[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof visits[0][col]}`);
      });
    } else {
      console.log('⚠️  Aucune donnée dans la table visits');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkOperationsSchema();
