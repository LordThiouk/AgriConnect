const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function debugGetAgentPerformance() {
  console.log('🔍 Débogage de get_agent_performance...\n');

  try {
    // 1. Récupérer un agent
    console.log('1️⃣ Récupération d\'un agent...');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .limit(1);

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) {
      console.log('❌ Aucun agent trouvé');
      return;
    }

    const agent = agents[0];
    console.log(`✅ Agent: ${agent.display_name} (${agent.id})`);

    // 2. Tester avec p_agent_id (paramètre suggéré par l'erreur)
    console.log('\n2️⃣ Test avec p_agent_id...');
    const { data: result1, error: error1 } = await supabase
      .rpc('get_agent_performance', { 
        p_agent_id: agent.id 
      });

    if (error1) {
      console.log('❌ Erreur avec p_agent_id:', error1.message);
    } else {
      console.log('✅ Succès avec p_agent_id:', result1);
    }

    // 3. Tester avec agent_id_param (paramètre utilisé par le service)
    console.log('\n3️⃣ Test avec agent_id_param...');
    const { data: result2, error: error2 } = await supabase
      .rpc('get_agent_performance', { 
        agent_id_param: agent.id 
      });

    if (error2) {
      console.log('❌ Erreur avec agent_id_param:', error2.message);
    } else {
      console.log('✅ Succès avec agent_id_param:', result2);
    }

    // 4. Tester avec agent_id (ancien paramètre)
    console.log('\n4️⃣ Test avec agent_id...');
    const { data: result3, error: error3 } = await supabase
      .rpc('get_agent_performance', { 
        agent_id: agent.id 
      });

    if (error3) {
      console.log('❌ Erreur avec agent_id:', error3.message);
    } else {
      console.log('✅ Succès avec agent_id:', result3);
    }

    // 5. Si aucune fonction ne fonctionne, créer une fonction simple
    if (error1 && error2 && error3) {
      console.log('\n5️⃣ Aucune fonction ne fonctionne, création d\'une fonction simple...');
      
      // Note: On ne peut pas créer de fonction via RPC, il faut une migration
      console.log('⚠️  Une migration est nécessaire pour créer la fonction');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

debugGetAgentPerformance();
