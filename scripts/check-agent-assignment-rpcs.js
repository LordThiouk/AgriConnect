const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function checkAgentAssignmentRPCs() {
  console.log('🔍 Vérification des RPCs d\'assignation d\'agents...\n');

  const rpcFunctions = [
    'assign_agent_to_producer',
    'assign_agent_to_cooperative',
    'remove_agent_assignment',
    'get_agent_assignments',
    'get_agent_producers_unified',
    'get_available_producers_for_agent',
    'get_available_agents'
  ];

  try {
    for (const rpcName of rpcFunctions) {
      console.log(`\n🔍 Test de ${rpcName}...`);
      
      try {
        // Test avec des paramètres factices pour voir si la fonction existe
        let testParams = {};
        
        if (rpcName === 'assign_agent_to_producer') {
          testParams = { p_agent_id: '00000000-0000-0000-0000-000000000000', p_producer_id: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'assign_agent_to_cooperative') {
          testParams = { p_agent_id: '00000000-0000-0000-0000-000000000000', p_cooperative_id: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'remove_agent_assignment') {
          testParams = { assignment_id_param: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'get_agent_assignments') {
          testParams = { p_agent_id: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'get_agent_producers_unified') {
          testParams = { p_agent_id: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'get_available_producers_for_agent') {
          testParams = { p_agent_id: '00000000-0000-0000-0000-000000000000' };
        } else if (rpcName === 'get_available_agents') {
          testParams = {};
        }

        const { data, error } = await supabase.rpc(rpcName, testParams);
        
        if (error) {
          if (error.message.includes('Could not find the function')) {
            console.log(`❌ ${rpcName}: Fonction non trouvée`);
          } else if (error.message.includes('violates foreign key constraint')) {
            console.log(`✅ ${rpcName}: Fonction existe (erreur FK normale avec UUID factice)`);
          } else {
            console.log(`✅ ${rpcName}: Fonction existe (erreur: ${error.message})`);
          }
        } else {
          console.log(`✅ ${rpcName}: Fonction existe et fonctionne`);
        }
      } catch (err) {
        if (err.message.includes('Could not find the function')) {
          console.log(`❌ ${rpcName}: Fonction non trouvée`);
        } else {
          console.log(`⚠️  ${rpcName}: Erreur inattendue - ${err.message}`);
        }
      }
    }

    // Vérifier les fonctions dans le schéma de la base
    console.log('\n\n🔍 Vérification des fonctions dans le schéma...');
    const { data: functions, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            proname as function_name,
            pg_get_function_arguments(oid) as arguments,
            pg_get_function_result(oid) as return_type
          FROM pg_proc 
          WHERE proname LIKE '%agent%' 
            AND proname LIKE '%assign%'
          ORDER BY proname;
        `
      });

    if (schemaError) {
      console.log('⚠️  Impossible de vérifier le schéma (normal si exec_sql n\'existe pas)');
    } else if (functions && functions.length > 0) {
      console.log('✅ Fonctions d\'assignation trouvées dans le schéma:');
      functions.forEach(func => {
        console.log(`   - ${func.function_name}(${func.arguments}) -> ${func.return_type}`);
      });
    } else {
      console.log('❌ Aucune fonction d\'assignation trouvée dans le schéma');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkAgentAssignmentRPCs();
