const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkExistingPlotFunctions() {
  console.log('🔍 Vérification des fonctions de parcelles existantes...');
  
  try {
    // Requête pour récupérer toutes les fonctions qui contiennent 'plot' dans le nom
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            proname as function_name,
            proargnames as argument_names,
            proargtypes as argument_types,
            prorettype as return_type,
            prosrc as source_code
          FROM pg_proc 
          WHERE proname ILIKE '%plot%' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          ORDER BY proname;
        `
      });
    
    if (error) {
      console.log('❌ Erreur lors de la récupération des fonctions:', error);
      return;
    }
    
    console.log('📋 Fonctions de parcelles existantes:');
    data.forEach(func => {
      console.log(`\n🔧 ${func.function_name}`);
      console.log(`   Arguments: ${func.argument_names ? func.argument_names.join(', ') : 'aucun'}`);
      console.log(`   Type de retour: ${func.return_type}`);
      if (func.source_code && func.source_code.length > 200) {
        console.log(`   Code source: ${func.source_code.substring(0, 200)}...`);
      } else {
        console.log(`   Code source: ${func.source_code}`);
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkExistingPlotFunctions();
