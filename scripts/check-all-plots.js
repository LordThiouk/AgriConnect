const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllPlots() {
  console.log('🔍 Vérification de toutes les parcelles...\n');

  try {
    // 1. Compter toutes les parcelles
    const { count: totalPlots, error: countError } = await supabase
      .from('farm_file_plots')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage parcelles:', countError);
      return;
    }

    console.log(`📊 Total parcelles: ${totalPlots}`);

    if (totalPlots > 0) {
      // 2. Récupérer quelques parcelles avec détails
      const { data: plots, error: plotsError } = await supabase
        .from('farm_file_plots')
        .select('id, name_season_snapshot, area_hectares, farm_file_id, soil_type, status')
        .limit(10);

      if (plotsError) {
        console.error('❌ Erreur parcelles:', plotsError);
        return;
      }

      console.log(`\n✅ ${plots.length} parcelles trouvées:`);
      plots.forEach((plot, index) => {
        console.log(`   ${index + 1}. ${plot.name_season_snapshot} (${plot.area_hectares} ha) - Fiche: ${plot.farm_file_id}`);
      });

      // 3. Vérifier les cultures de ces parcelles
      const plotIds = plots.map(p => p.id);
      const { data: crops, error: cropsError } = await supabase
        .from('crops')
        .select('id, crop_type, variety, farm_file_plot_id, status')
        .in('farm_file_plot_id', plotIds);

      if (cropsError) {
        console.error('❌ Erreur cultures:', cropsError);
      } else {
        console.log(`\n✅ ${crops?.length || 0} cultures trouvées pour ces parcelles:`);
        crops?.forEach(crop => {
          console.log(`   - ${crop.crop_type} - ${crop.variety} (${crop.status}) - Parcelle: ${crop.farm_file_plot_id}`);
        });
      }

      // 4. Vérifier les fiches d'exploitation de ces parcelles
      const farmFileIds = [...new Set(plots.map(p => p.farm_file_id))];
      const { data: farmFiles, error: farmFilesError } = await supabase
        .from('farm_files')
        .select('id, name, responsible_producer_id, status')
        .in('id', farmFileIds);

      if (farmFilesError) {
        console.error('❌ Erreur fiches:', farmFilesError);
      } else {
        console.log(`\n✅ ${farmFiles?.length || 0} fiches d'exploitation associées:`);
        farmFiles?.forEach(ff => {
          console.log(`   - ${ff.name} (${ff.status}) - Producteur: ${ff.responsible_producer_id}`);
        });
      }

    } else {
      console.log('⚠️ Aucune parcelle trouvée dans la base de données');
      
      // Vérifier s'il y a des fiches d'exploitation
      const { count: totalFarmFiles, error: farmFilesCountError } = await supabase
        .from('farm_files')
        .select('*', { count: 'exact', head: true });

      if (farmFilesCountError) {
        console.error('❌ Erreur comptage fiches:', farmFilesCountError);
      } else {
        console.log(`📊 Total fiches d'exploitation: ${totalFarmFiles}`);
        if (totalFarmFiles > 0) {
          console.log('💡 Les fiches existent mais n\'ont pas de parcelles associées');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkAllPlots().then(() => {
  console.log('\n🎉 Vérification terminée');
}).catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
});
