const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecommendationsForeignKeys() {
  console.log('🔍 Vérification des foreign keys de la table recommendations...\n');

  try {
    // Vérifier les données existantes dans recommendations pour comprendre la structure
    const { data: recsExistantes, error: recsError } = await supabase
      .from('recommendations')
      .select('*')
      .not('plot_id', 'is', null)
      .limit(3);

    if (recsError) {
      console.error('❌ Erreur lors de la récupération des recommandations:', recsError.message);
    } else if (recsExistantes && recsExistantes.length > 0) {
      console.log('📋 Recommandations existantes avec plot_id non-null:');
      recsExistantes.forEach((rec, index) => {
        console.log(`   ${index + 1}. plot_id: "${rec.plot_id}"`);
      });
    }

    // Vérifier les plot ID existants dans farm_file_plots
    const { data: farmFilePlots, error: plotsError } = await supabase
      .from('farm_file_plots')
      .select('id, name_season_snapshot')
      .limit(3);

    if (plotsError) {
      console.error('❌ Erreur farm_file_plots:', plotsError.message);
    } else {
      console.log('\n📋 farm_file_plots disponibles:');
      farmFilePlots?.forEach((plot, index) => {
        console.log(`   ${index + 1}. ID: ${plot.id}, Nom: "${plot.name_season_snapshot}"`);
      });

      // Test avec le premier plot disponible
      if (farmFilePlots && farmFilePlots.length > 0) {
        const testPlotId = farmFilePlots[0].id;
        console.log(`\n🧪 Test de création avec plot_id valide: ${testPlotId}`);

        const testRec = {
          plot_id: testPlotId,
          producer_id: '0008cc25-2a95-45dc-901c-030251d80ba2', // Utiliser le producer existant
          title: "Test recommendation validation",
          message: "Ceci est un test pour vérifier les foreign keys",
          recommendation_type: "other",
          priority: "low",
          status: "pending",
          rule_code: null
        };

        const { data: insertedTest, error: testError } = await supabase
          .from('recommendations')
          .insert([testRec])
          .select();

        if (testError) {
          console.error(`   ❌ Test échoué:`, testError.message);
        } else {
          console.log(`   ✅ Test de recommendation réussit (ID: ${insertedTest?.[0]?.id})`);
          // Nettoyer l'enregistrement de test
          await supabase
            .from('recommendations')
            .delete()
            .eq('id', insertedTest?.[0]?.id);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale dans checkRecommendationsForeignKeys:', error);
  }
}

checkRecommendationsForeignKeys().catch(console.error);
