const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecommendationConstraints() {
  console.log('🔍 Analyse des contraintes et types de recommandations...\n');

  try {
    // 1. Analyser les recommendation_type existants
    const { data, error } = await supabase
      .from('recommendations')
      .select('recommendation_type');

    if (error) {
      console.error('❌ Erreur lors de la récupération des types distincts:', error);
      return;
    }

    console.log('📋 Types de recommandations trouvés et leur quantité:');
    const types = {};
    data?.forEach(rec => {
      const type = rec.recommendation_type || 'null';
      types[type] = (types[type] || 0) + 1;
    });
    Object.keys(types).forEach(type => {
      console.log(`   - "${type}": ${types[type]} occurrences`);
    });

    // 2 shows des échantillons
    const { data: sampleData, error: sampleError } = await supabase
      .from('recommendations')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Erreur lors de la récupération des échantillons:', sampleError);
    } else {
      console.log('\n📊 Échantillons (détails seulement les fields importantes):');
      sampleData?.forEach((rec, index) => {
        console.log(`   Recommendation ${index + 1}:`);
        console.log(`     - type: "${rec.recommendation_type || 'null'}"`);
        console.log(`     - priority: "${rec.priority || 'null'}"`);
        console.log(`     - status: "${rec.status || 'null'}"`);
        console.log(`     - plot_id: "${rec.plot_id || 'null'}"`);
      });
    }

    // Diagnostic supplémentaire - Essai de création avec des valeurs possiblement valides
    const testTypes = [
      'irrigation', 
      'fertilization', 
      'protection', 
      'harvest', 
      'company',
      'default',
      'agriculture'
    ];

    console.log('\n🧪 Test des types de recommandation potentiels:');
    for (const testType of testTypes) {
      try {
        const testRec = {
          plot_id: '556d16c2-e2d4-4df5-9ba8-2d3dbda56ba8',
          producer_id: '0008cc25-2a95-45dc-901c-030251d80ba2', 
          title: `Test ${testType}`,
          message: `Test message for ${testType}`,
          recommendation_type: testType,
          priority: 'low',
          status: 'pending'
        };

        const { error: testError } = await supabase
          .from('recommendations')
          .insert([testRec]);

        if (testError && testError.code === '23514') {
          console.log(`   ❌ "${testType}" - Non conforme aux contraintes CHECK`);
        } else if (testError) {
          console.log(`   ❌ "${testType}" - Autre erreur:`, testError.message);
        } else {
          console.log(`   ✅ "${testType}" - Successfully inserted`);
          // Supprimer ce test record après vérification
          try {
            await supabase.from('recommendations')
              .delete()
              .eq('title', `Test ${testType}`);
          } catch (deleteErr) {
            // Ignore delete errors
          }
        }
      } catch (err) {
        console.log(`   ❌ "${testType}" - Error setting insert test`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale dans checkRecommendationConstraints:', error);
  }
}

checkRecommendationConstraints().catch(console.error);
