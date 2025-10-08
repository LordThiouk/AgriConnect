const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestRecommendations() {
  console.log('🧪 Création de recommandations de test pour la parcelle...\n');

  try {
    // Utiliser la parcelle de l'utilisateur
    const plotId = '556d16c2-e2d4-4df5-9ba8-2d3dbda56ba8';
    const producerId = '0008cc25-2a95-45dc-901c-030251d80ba2'; // Producteur depuis les assignments

    // Test des recommandations sans plot_id car foreign key incorrect (plots vs farm_file_plots)
    const testRecommendations = [
      {
        producer_id: producerId,
        title: "Irrigation recommandée",
        message: `Irrigation spécialement pour ${plotId}: Les conditions météo indiquent un besoin d'irrigation supplémentaire pour maintenir une humidité optimale dans la parcelle B2 - Légumes.`,
        recommendation_type: "irrigation",
        priority: "high",
        status: "pending"
      },
      {
        producer_id: producerId,
        title: "Fertilisation simplifiée",
        message: `Fertilisation pour la parcelle B2: Application d'engrais foliaire recommandée pour améliorer le rendement des légumes en cours de croissance sur cette parcelle.`,
        recommendation_type: "fertilisation", 
        priority: "medium",
        status: "pending"
      },
      {
        producer_id: producerId,
        title: "Gestion phytosanitaire",
        message: `Protection de parcelle: Traitement préventif contre les parasites recommandé dans les prochains jours selon les prévisions météo pour la parcelle B2 - Légumes.`,
        recommendation_type: "pest_control",
        priority: "high",
        status: "acknowledged"
      }
    ];

    console.log(`➕ Insertion de ${testRecommendations.length} recommandations de test...`);

    const { data, error } = await supabase
      .from('recommendations')
      .insert(testRecommendations)
      .select();

    if (error) {
      console.error('❌ Erreur lors de l\'insertion des recommandations:', error);
      return;
    }

    console.log('✅ Recommandations créées avec succès:');
    data.forEach((rec, index) => {
      console.log(`   ${index + 1}. "${rec.title}" - ${rec.status} (ID: ${rec.id})`);
    });

    // Vérifier les nouvelles recommandations pour cette parcelle
    console.log('\n🔍 Vérification des recommandations créées pour la parcelle:');
    const { data: checkData, error: checkError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('plot_id', plotId);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
    } else {
      console.log(`✅ ${checkData?.length || 0} recommandations trouvées pour la parcelle ${plotId}`);
      checkData?.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} (${rec.status}) - ${rec.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale dans createTestRecommendations:', error);
  }
}

createTestRecommendations().catch(console.error);
