const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkCropsTableStructure() {
  console.log('🔍 Vérification de la structure de la table crops...');
  
  try {
    // Récupérer quelques cultures pour voir la structure
    const { data: crops, error } = await supabase
      .from('crops')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Erreur lors de la récupération des cultures:', error);
      return;
    }

    console.log('📋 Structure de la table crops:');
    if (crops && crops.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(crops[0]));
      console.log('Exemple de culture:', JSON.stringify(crops[0], null, 2));
    } else {
      console.log('Aucune culture trouvée');
    }

    // Vérifier les relations avec les parcelles
    console.log('\n🔗 Vérification des relations crops-plots...');
    const { data: cropsWithPlots, error: error2 } = await supabase
      .from('crops')
      .select(`
        id,
        plot_id,
        crop_type,
        variety,
        created_at,
        plots!inner(
          id,
          name_season_snapshot
        )
      `)
      .limit(2);

    if (error2) {
      console.log('❌ Erreur lors de la récupération des cultures avec parcelles:', error2);
    } else {
      console.log('✅ Relations crops-plots fonctionnent');
      console.log('Exemple avec parcelle:', JSON.stringify(cropsWithPlots[0], null, 2));
    }
    
    const { count, error: countError } = await supabase
      .from('crops')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage des cultures:', countError);
    } else {
      console.log(`📊 Total des cultures: ${count}`);
    }

  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkCropsTableStructure();
