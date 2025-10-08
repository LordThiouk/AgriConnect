const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function listExistingPlotRPCs() {
  console.log('🔍 Liste des RPCs de parcelles existants...');
  
  try {
    // Requête pour récupérer toutes les fonctions qui contiennent 'plot' dans le nom
    const { data, error } = await supabase
      .from('pg_proc')
      .select(`
        proname,
        proargnames,
        proargtypes
      `)
      .ilike('proname', '%plot%')
      .eq('pronamespace', (await supabase.from('pg_namespace').select('oid').eq('nspname', 'public')).data[0].oid);
    
    if (error) {
      console.log('❌ Erreur lors de la récupération des fonctions:', error);
      return;
    }
    
    console.log('📋 Fonctions de parcelles disponibles:');
    data.forEach(func => {
      console.log(`  - ${func.proname}(${func.proargnames ? func.proargnames.join(', ') : 'aucun paramètre'})`);
    });
    
    // Tester get_plots_by_producer avec un UUID valide
    console.log('\n🧪 Test de get_plots_by_producer avec UUID valide...');
    const { data: testData, error: testError } = await supabase.rpc('get_plots_by_producer', {
      p_producer_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (testError) {
      console.log('❌ get_plots_by_producer erreur:', testError.message);
    } else {
      console.log('✅ get_plots_by_producer fonctionne, données:', testData?.length || 0, 'parcelles');
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

listExistingPlotRPCs();
