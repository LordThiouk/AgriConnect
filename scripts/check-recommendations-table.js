/**
 * Script pour vérifier la structure de la table recommendations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecommendationsTable() {
  try {
    console.log('🔍 Vérification de la table recommendations...\n');

    // Récupérer un échantillon pour voir la structure
    const { data: sampleRec, error: sampleError } = await supabase
      .from('recommendations')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erreur lors de la récupération d\'un échantillon:', sampleError);
      return;
    }

    if (sampleRec && sampleRec.length > 0) {
      console.log('📋 Structure de la table recommendations (via échantillon):');
      Object.keys(sampleRec[0]).forEach(key => {
        const value = sampleRec[0][key];
        const type = typeof value;
        console.log(`   - ${key}: ${type} ${value === null ? '(NULL)' : ''}`);
      });
    } else {
      console.log('   Aucune donnée trouvée dans la table recommendations');
    }

    // Compter le nombre total
    const { count: totalRecs, error: countError } = await supabase
      .from('recommendations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
    } else {
      console.log(`\n📊 Total des recommandations: ${totalRecs}`);
    }

    console.log('\n✅ Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
checkRecommendationsTable();
