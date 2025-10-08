const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlotRPCs() {
  console.log('🔍 Vérification des RPCs de parcelles disponibles...');
  
  try {
    // Tester get_plots_by_producer qui existe
    console.log('\n🧪 Test de get_plots_by_producer...');
    const { data: testData, error: testError } = await supabase.rpc('get_plots_by_producer', {
      p_producer_id: 'test'
    });
    
    if (testError) {
      console.log('❌ get_plots_by_producer erreur:', testError.message);
    } else {
      console.log('✅ get_plots_by_producer fonctionne');
    }
    
    // Vérifier si get_agent_plots_with_geolocation existe
    console.log('\n🧪 Test de get_agent_plots_with_geolocation...');
    const { data: testData2, error: testError2 } = await supabase.rpc('get_agent_plots_with_geolocation', {
      p_agent_user_id: 'test'
    });
    
    if (testError2) {
      console.log('❌ get_agent_plots_with_geolocation erreur:', testError2.message);
    } else {
      console.log('✅ get_agent_plots_with_geolocation fonctionne');
    }
    
    // Vérifier d'autres RPCs possibles
    console.log('\n🧪 Test de get_plots_with_geolocation...');
    const { data: testData3, error: testError3 } = await supabase.rpc('get_plots_with_geolocation', {
      agent_id_param: 'test'
    });
    
    if (testError3) {
      console.log('❌ get_plots_with_geolocation erreur:', testError3.message);
    } else {
      console.log('✅ get_plots_with_geolocation fonctionne');
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkPlotRPCs();
