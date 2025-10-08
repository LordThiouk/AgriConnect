const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkObservationsTableStructure() {
  console.log('🔍 Vérification de la structure de la table observations...');
  
  try {
    // Récupérer quelques observations pour voir la structure
    const { data: observations, error } = await supabase
      .from('observations')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Erreur lors de la récupération des observations:', error);
      return;
    }

    console.log('📋 Structure de la table observations:');
    if (observations && observations.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(observations[0]));
      console.log('Exemple d\'observation:', JSON.stringify(observations[0], null, 2));
    } else {
      console.log('Aucune observation trouvée');
    }

    // Vérifier les relations avec les parcelles
    console.log('\n🔗 Vérification des relations observations-plots...');
    const { data: observationsWithPlots, error: error2 } = await supabase
      .from('observations')
      .select(`
        id,
        plot_id,
        observation_type,
        description,
        severity,
        created_at,
        plots!inner(
          id,
          name_season_snapshot,
          producer_id
        )
      `)
      .limit(2);

    if (error2) {
      console.log('❌ Erreur lors de la récupération des observations avec parcelles:', error2);
    } else {
      console.log('✅ Relations observations-plots fonctionnent');
      console.log('Exemple avec parcelle:', JSON.stringify(observationsWithPlots[0], null, 2));
    }
    
    const { count, error: countError } = await supabase
      .from('observations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage des observations:', countError);
    } else {
      console.log(`📊 Total des observations: ${count}`);
    }

  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkObservationsTableStructure();
