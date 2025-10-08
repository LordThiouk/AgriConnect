const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function debugAgentAssignmentsDisplay() {
  console.log('🔍 Débogage de l\'affichage des assignations...\n');

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

    // 2. Récupérer les assignations avec get_agent_assignments
    console.log('\n2️⃣ Assignations via get_agent_assignments...');
    const { data: assignments, error: assignmentsError } = await supabase
      .rpc('get_agent_assignments', { p_agent_id: agent.id });

    if (assignmentsError) {
      console.log('❌ Erreur get_agent_assignments:', assignmentsError.message);
      return;
    }

    console.log(`✅ ${assignments.length} assignations trouvées:`);
    assignments.forEach((assignment, index) => {
      console.log(`\n   Assignation ${index + 1}:`);
      console.log(`   - ID: ${assignment.id}`);
      console.log(`   - Type: ${assignment.assigned_to_type}`);
      console.log(`   - Assigned to ID: ${assignment.assigned_to_id}`);
      console.log(`   - Name: ${assignment.name || 'UNDEFINED'}`);
      console.log(`   - Display name: ${assignment.display_name || 'UNDEFINED'}`);
      console.log(`   - First name: ${assignment.first_name || 'UNDEFINED'}`);
      console.log(`   - Last name: ${assignment.last_name || 'UNDEFINED'}`);
      console.log(`   - Phone: ${assignment.phone || 'UNDEFINED'}`);
      console.log(`   - Region: ${assignment.region || 'UNDEFINED'}`);
      console.log(`   - Assigned at: ${assignment.assigned_at}`);
    });

    // 3. Vérifier directement la table agent_assignments
    console.log('\n3️⃣ Vérification directe de la table agent_assignments...');
    const { data: directAssignments, error: directError } = await supabase
      .from('agent_assignments')
      .select('*')
      .eq('agent_id', agent.id);

    if (directError) {
      console.log('❌ Erreur table directe:', directError.message);
    } else {
      console.log(`✅ ${directAssignments.length} assignations directes:`);
      directAssignments.forEach((assignment, index) => {
        console.log(`\n   Assignation directe ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Agent ID: ${assignment.agent_id}`);
        console.log(`   - Assigned to type: ${assignment.assigned_to_type}`);
        console.log(`   - Assigned to ID: ${assignment.assigned_to_id}`);
        console.log(`   - Assigned at: ${assignment.assigned_at}`);
      });
    }

    // 4. Pour chaque assignation, récupérer les détails de l'élément assigné
    console.log('\n4️⃣ Détails des éléments assignés...');
    for (const assignment of assignments) {
      if (assignment.assigned_to_type === 'producer') {
        console.log(`\n   Producteur ${assignment.assigned_to_id}:`);
        const { data: producer, error: producerError } = await supabase
          .from('producers')
          .select('*')
          .eq('id', assignment.assigned_to_id)
          .single();

        if (producerError) {
          console.log(`   ❌ Erreur producteur: ${producerError.message}`);
        } else {
          console.log(`   ✅ Producteur: ${producer.first_name} ${producer.last_name}`);
          console.log(`   ✅ Téléphone: ${producer.phone}`);
          console.log(`   ✅ Région: ${producer.region}`);
        }
      } else if (assignment.assigned_to_type === 'cooperative') {
        console.log(`\n   Coopérative ${assignment.assigned_to_id}:`);
        const { data: cooperative, error: cooperativeError } = await supabase
          .from('cooperatives')
          .select('*')
          .eq('id', assignment.assigned_to_id)
          .single();

        if (cooperativeError) {
          console.log(`   ❌ Erreur coopérative: ${cooperativeError.message}`);
        } else {
          console.log(`   ✅ Coopérative: ${cooperative.name}`);
          console.log(`   ✅ Région: ${cooperative.region}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

debugAgentAssignmentsDisplay();
