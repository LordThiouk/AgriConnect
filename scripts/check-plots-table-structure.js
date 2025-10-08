const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkPlotsTable() {
  console.log('🔍 Vérification de la structure de la table plots...');
  
  try {
    // Récupérer quelques parcelles pour voir la structure
    const { data: plots, error } = await supabase
      .from('plots')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ Erreur lors de la récupération des parcelles:', error);
      return;
    }
    
    console.log('📋 Structure de la table plots:');
    if (plots && plots.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(plots[0]));
      console.log('Exemple de parcelle:', JSON.stringify(plots[0], null, 2));
    } else {
      console.log('Aucune parcelle trouvée');
    }
    
    // Vérifier les relations avec les producteurs
    console.log('\n🔗 Vérification des relations...');
    const { data: plotsWithProducers, error: error2 } = await supabase
      .from('plots')
      .select(`
        id,
        name_season_snapshot,
        area_hectares,
        soil_type,
        water_source,
        status,
        geom,
        center_point,
        producer_id,
        producers!inner(
          id,
          first_name,
          last_name
        )
      `)
      .limit(2);
    
    if (error2) {
      console.log('❌ Erreur lors de la récupération des parcelles avec producteurs:', error2);
    } else {
      console.log('✅ Relations plots-producers fonctionnent');
      console.log('Exemple avec producteur:', JSON.stringify(plotsWithProducers[0], null, 2));
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkPlotsTable();
