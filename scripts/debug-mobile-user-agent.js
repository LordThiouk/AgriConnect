const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function debugMobileUserAgent() {
  console.log('🔍 Debug de l\'utilisateur agent dans l\'app mobile...');
  
  try {
    // Récupérer tous les agents
    console.log('\n1️⃣ Liste de tous les agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, phone')
      .eq('role', 'agent');
    
    if (agentsError) {
      console.log('❌ Erreur lors de la récupération des agents:', agentsError);
      return;
    }
    
    console.log('📋 Agents trouvés:', agents.length);
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.display_name}`);
      console.log(`   - ID: ${agent.id}`);
      console.log(`   - User ID: ${agent.user_id}`);
      console.log(`   - Téléphone: ${agent.phone}`);
    });
    
    // Tester avec chaque agent
    console.log('\n2️⃣ Test des parcelles pour chaque agent...');
    for (const agent of agents) {
      console.log(`\n🧪 Test pour ${agent.display_name} (${agent.user_id})...`);
      
      const { data: plots, error: rpcError } = await supabase
        .rpc('get_agent_plots_with_geolocation', {
          p_agent_user_id: agent.user_id
        });

      if (rpcError) {
        console.log(`❌ Erreur RPC pour ${agent.display_name}:`, rpcError.message);
        continue;
      }

      console.log(`✅ Parcelles trouvées pour ${agent.display_name}:`, plots?.length || 0);
      
      if (plots && plots.length > 0) {
        console.log(`   Exemple: ${plots[0].name_season_snapshot} (${plots[0].producer_name})`);
      }
    }
    
    // Vérifier les assignations
    console.log('\n3️⃣ Vérification des assignations...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select(`
        id,
        agent_id,
        assigned_to_id,
        assigned_to_type,
        profiles!agent_assignments_agent_id_fkey(
          display_name,
          user_id
        )
      `);
    
    if (assignmentsError) {
      console.log('❌ Erreur lors de la récupération des assignations:', assignmentsError);
      return;
    }
    
    console.log('📊 Total des assignations:', assignments.length);
    
    // Grouper par agent
    const assignmentsByAgent = {};
    assignments.forEach(assignment => {
      const agentName = assignment.profiles?.display_name || 'Inconnu';
      if (!assignmentsByAgent[agentName]) {
        assignmentsByAgent[agentName] = [];
      }
      assignmentsByAgent[agentName].push(assignment);
    });
    
    Object.entries(assignmentsByAgent).forEach(([agentName, agentAssignments]) => {
      console.log(`\n👤 ${agentName}:`);
      console.log(`   - Assignations totales: ${agentAssignments.length}`);
      
      const producerAssignments = agentAssignments.filter(a => a.assigned_to_type === 'producer');
      console.log(`   - Producteurs assignés: ${producerAssignments.length}`);
      
      if (producerAssignments.length > 0) {
        console.log(`   - IDs des producteurs: ${producerAssignments.map(a => a.assigned_to_id).join(', ')}`);
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

debugMobileUserAgent();
