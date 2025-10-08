const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function checkCooperativesSchema() {
  console.log('🔍 Vérification du schéma de la table cooperatives...\n');

  try {
    // Récupérer la structure de la table cooperatives
    console.log('1️⃣ Structure de la table cooperatives...');
    const { data: cooperatives, error: cooperativesError } = await supabase
      .from('cooperatives')
      .select('*')
      .limit(1);

    if (cooperativesError) {
      console.log('❌ Erreur lors de la récupération des cooperatives:', cooperativesError.message);
      return;
    }

    if (cooperatives && cooperatives.length > 0) {
      console.log('✅ Colonnes de la table cooperatives:');
      Object.keys(cooperatives[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof cooperatives[0][col]}`);
      });
    } else {
      console.log('⚠️  Aucune donnée dans la table cooperatives');
    }

    // Récupérer toutes les coopératives
    console.log('\n2️⃣ Toutes les coopératives...');
    const { data: allCoops, error: allCoopsError } = await supabase
      .from('cooperatives')
      .select('*');

    if (allCoopsError) {
      console.log('❌ Erreur:', allCoopsError.message);
    } else {
      console.log(`✅ ${allCoops.length} coopératives trouvées:`);
      allCoops.forEach((coop, index) => {
        console.log(`   ${index + 1}. ${coop.name} (${coop.region || 'Pas de région'}) - ID: ${coop.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkCooperativesSchema();