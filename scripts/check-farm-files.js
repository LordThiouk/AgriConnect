const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFarmFiles() {
  console.log('🔍 Vérification des fiches d\'exploitation...\n');

  try {
    // 1. Compter toutes les fiches d'exploitation
    const { count: totalFarmFiles, error: countError } = await supabase
      .from('farm_files')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage fiches:', countError);
      return;
    }

    console.log(`📊 Total fiches d'exploitation: ${totalFarmFiles}`);

    // 2. Récupérer quelques fiches avec détails
    const { data: farmFiles, error: farmFilesError } = await supabase
      .from('farm_files')
      .select('id, name, responsible_producer_id, status, created_at')
      .limit(10);

    if (farmFilesError) {
      console.error('❌ Erreur récupération fiches:', farmFilesError);
      return;
    }

    if (farmFiles && farmFiles.length > 0) {
      console.log(`\n✅ ${farmFiles.length} fiches trouvées:`);
      farmFiles.forEach((ff, index) => {
        console.log(`   ${index + 1}. ${ff.name} (${ff.status}) - Producteur: ${ff.responsible_producer_id}`);
      });

      // 3. Vérifier les parcelles de ces fiches
      const farmFileIds = farmFiles.map(ff => ff.id);
      console.log(`\n🔍 Recherche des parcelles pour ces fiches...`);

      const { data: plots, error: plotsError } = await supabase
        .from('farm_file_plots')
        .select('id, name_season_snapshot, area_hectares, farm_file_id')
        .in('farm_file_id', farmFileIds);

      if (plotsError) {
        console.error('❌ Erreur parcelles:', plotsError);
      } else {
        console.log(`✅ ${plots?.length || 0} parcelles trouvées:`);
        plots?.forEach(plot => {
          console.log(`   - ${plot.name_season_snapshot} (${plot.area_hectares} ha) - Fiche: ${plot.farm_file_id}`);
        });
      }
    } else {
      console.log('⚠️ Aucune fiche d\'exploitation trouvée');
      
      // Vérifier s'il y a des producteurs
      const { data: producers, error: producersError } = await supabase
        .from('producers')
        .select('id, first_name, last_name')
        .limit(5);

      if (producersError) {
        console.error('❌ Erreur producteurs:', producersError);
      } else if (producers && producers.length > 0) {
        console.log(`\n📋 Producteurs disponibles (${producers.length}):`);
        producers.forEach(p => {
          console.log(`   - ${p.first_name} ${p.last_name} (${p.id})`);
        });
        console.log('\n💡 Suggestion: Créer des fiches d\'exploitation pour ces producteurs');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkFarmFiles().then(() => {
  console.log('\n🎉 Vérification terminée');
}).catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
});
