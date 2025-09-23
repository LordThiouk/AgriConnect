const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicatePlotIds() {
  console.log('🔍 Vérification des IDs dupliqués dans les parcelles...\n');

  try {
    // 1. Récupérer toutes les parcelles via la fonction RPC utilisée par PlotsService
    console.log('1️⃣ Récupération des parcelles via get_plots_with_geolocation...');
    const { data: plots, error: plotsError } = await supabase
      .rpc('get_plots_with_geolocation', {
        search_param: null,
        producer_id_param: null,
        status_param: null,
        soil_type_param: null,
        water_source_param: null,
        region_param: null,
        cooperative_id_param: null,
        page_param: 1,
        limit_param: 100
      });

    if (plotsError) {
      console.error('❌ Erreur get_plots_with_geolocation:', plotsError);
      return;
    }

    console.log(`✅ ${plots?.length || 0} parcelles récupérées`);

    // 2. Vérifier les IDs dupliqués
    const ids = plots?.map(plot => plot.id) || [];
    const uniqueIds = [...new Set(ids)];
    
    if (ids.length !== uniqueIds.length) {
      console.log('❌ IDs dupliqués détectés !');
      console.log(`   Total: ${ids.length}, Unique: ${uniqueIds.length}`);
      
      // Trouver les IDs dupliqués
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];
      
      console.log('   IDs dupliqués:');
      uniqueDuplicates.forEach(duplicateId => {
        const count = ids.filter(id => id === duplicateId).length;
        console.log(`   - ${duplicateId} (${count} fois)`);
        
        // Afficher les détails des parcelles avec cet ID
        const plotsWithThisId = plots.filter(plot => plot.id === duplicateId);
        plotsWithThisId.forEach((plot, index) => {
          console.log(`     ${index + 1}. ${plot.name || 'Sans nom'} - ${plot.producer_name || 'Sans producteur'}`);
        });
      });
    } else {
      console.log('✅ Aucun ID dupliqué trouvé');
    }

    // 3. Vérifier les farm_file_plot_id dupliqués
    const farmFilePlotIds = plots?.map(plot => plot.farm_file_plot_id).filter(id => id) || [];
    const uniqueFarmFilePlotIds = [...new Set(farmFilePlotIds)];
    
    if (farmFilePlotIds.length !== uniqueFarmFilePlotIds.length) {
      console.log('\n❌ farm_file_plot_id dupliqués détectés !');
      console.log(`   Total: ${farmFilePlotIds.length}, Unique: ${uniqueFarmFilePlotIds.length}`);
      
      const duplicates = farmFilePlotIds.filter((id, index) => farmFilePlotIds.indexOf(id) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];
      
      console.log('   farm_file_plot_id dupliqués:');
      uniqueDuplicates.forEach(duplicateId => {
        const count = farmFilePlotIds.filter(id => id === duplicateId).length;
        console.log(`   - ${duplicateId} (${count} fois)`);
      });
    } else {
      console.log('\n✅ Aucun farm_file_plot_id dupliqué trouvé');
    }

    // 4. Afficher quelques exemples de données
    console.log('\n4️⃣ Exemples de données:');
    if (plots && plots.length > 0) {
      plots.slice(0, 3).forEach((plot, index) => {
        console.log(`   ${index + 1}. ID: ${plot.id}`);
        console.log(`      Name: ${plot.name || 'N/A'}`);
        console.log(`      Farm File Plot ID: ${plot.farm_file_plot_id || 'N/A'}`);
        console.log(`      Producer: ${plot.producer_name || 'N/A'}`);
        console.log('');
      });
    }

    console.log('🎉 Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkDuplicatePlotIds();
