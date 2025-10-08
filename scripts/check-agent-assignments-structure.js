const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkAgentAssignmentsTable() {
  console.log('🔍 Vérification de la structure de la table agent_assignments...');
  
  try {
    // Récupérer quelques assignations pour voir la structure
    const { data: assignments, error } = await supabase
      .from('agent_assignments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Erreur lors de la récupération des assignations:', error);
      return;
    }
    
    console.log('📋 Structure de la table agent_assignments:');
    if (assignments && assignments.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(assignments[0]));
      console.log('Exemple d\'assignation:', JSON.stringify(assignments[0], null, 2));
    } else {
      console.log('Aucune assignation trouvée');
    }
    
    // Vérifier les relations avec les agents et producteurs
    console.log('\n🔗 Vérification des relations agent_assignments...');
    const { data: assignmentsWithDetails, error: error2 } = await supabase
      .from('agent_assignments')
      .select(`
        id,
        agent_id,
        assigned_to_id,
        assigned_to_type,
        created_at,
        profiles!agent_assignments_agent_id_fkey(
          id,
          user_id,
          display_name,
          role
        )
      `)
      .limit(3);
    
    if (error2) {
      console.log('❌ Erreur lors de la récupération des assignations avec détails:', error2);
    } else {
      console.log('✅ Relations agent_assignments-profiles fonctionnent');
      console.log('Exemple avec agent:', JSON.stringify(assignmentsWithDetails[0], null, 2));
    }
    
    // Vérifier les assignations de type 'producer'
    console.log('\n🌾 Vérification des assignations de producteurs...');
    const { data: producerAssignments, error: error3 } = await supabase
      .from('agent_assignments')
      .select(`
        id,
        agent_id,
        assigned_to_id,
        assigned_to_type,
        created_at
      `)
      .eq('assigned_to_type', 'producer')
      .limit(3);
    
    if (error3) {
      console.log('❌ Erreur lors de la récupération des assignations de producteurs:', error3);
    } else {
      console.log('✅ Assignations de producteurs trouvées:', producerAssignments.length);
      console.log('Exemple d\'assignation producteur:', JSON.stringify(producerAssignments[0], null, 2));
    }
    
    // Compter le nombre total d'assignations
    const { count: totalAssignments, error: countError } = await supabase
      .from('agent_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Erreur lors du comptage des assignations:', countError);
    } else {
      console.log('📊 Total des assignations:', totalAssignments);
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkAgentAssignmentsTable();