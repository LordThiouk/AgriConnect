/**
 * Vérification de l'agent et des assignations
 */

require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');    
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAgentAndAssignments() {
  console.log('🧪 === VÉRIFICATION AGENT ET ASSIGNATIONS ===\n');
  
  const testAgentId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
  
  try {
    // 1. Vérifier si l'agent existe dans profiles
    console.log('📊 Vérification de l\'agent dans profiles...');
    const { data: agent, error: agentError } = await supabase
      .from('profiles')
      .select('id, display_name, role, cooperative_id')
      .eq('id', testAgentId)
      .single();
    
    if (agentError) {
      console.error('❌ Erreur agent:', agentError);
    } else {
      console.log('✅ Agent trouvé:', agent);
    }
    
    // 2. Vérifier toutes les assignations dans agent_assignments
    console.log('\n📊 Toutes les assignations dans agent_assignments...');
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('agent_assignments')
      .select('*')
      .limit(20);
    
    if (allAssignmentsError) {
      console.error('❌ Erreur toutes assignations:', allAssignmentsError);
    } else {
      console.log('✅ Total assignations dans la base:', allAssignments?.length || 0);
      console.log('📋 Détails:', allAssignments?.slice(0, 5));
    }
    
    // 3. Vérifier les assignations pour cet agent spécifiquement
    console.log('\n📊 Assignations pour cet agent spécifiquement...');
    const { data: agentAssignments, error: agentAssignmentsError } = await supabase
      .from('agent_assignments')
      .select('*')
      .eq('agent_id', testAgentId);
    
    if (agentAssignmentsError) {
      console.error('❌ Erreur assignations agent:', agentAssignmentsError);
    } else {
      console.log('✅ Assignations pour cet agent:', agentAssignments?.length || 0);
      console.log('📋 Détails:', agentAssignments);
    }
    
    // 4. Vérifier les producteurs dans la base
    console.log('\n📊 Vérification des producteurs dans la base...');
    const { data: allProducers, error: allProducersError } = await supabase
      .from('producers')
      .select('id, producer_name')
      .limit(20);
    
    if (allProducersError) {
      console.error('❌ Erreur producteurs:', allProducersError);
    } else {
      console.log('✅ Total producteurs dans la base:', allProducers?.length || 0);
      console.log('📋 Détails:', allProducers?.slice(0, 5));
    }
    
    // 5. Vérifier les parcelles de cet agent
    console.log('\n📊 Parcelles de cet agent...');
    const { data: agentPlots, error: plotsError } = await supabase
      .rpc('get_agent_plots_with_geolocation', {
        p_agent_user_id: testAgentId
      });
    
    if (plotsError) {
      console.error('❌ Erreur parcelles:', plotsError);
    } else {
      console.log('✅ Parcelles de l\'agent:', agentPlots?.length || 0);
      if (agentPlots && agentPlots.length > 0) {
        const uniqueProducers = [...new Set(agentPlots.map(p => p.producer_id))];
        console.log('📊 Producteurs uniques des parcelles:', uniqueProducers.length);
        console.log('📋 IDs producteurs:', uniqueProducers.slice(0, 5));
      }
    }
    
    // 6. Rechercher des assignations avec des IDs similaires
    console.log('\n📊 Recherche d\'assignations avec des IDs similaires...');
    const agentIdPrefix = testAgentId.substring(0, 8);
    const { data: similarAssignments, error: similarError } = await supabase
      .from('agent_assignments')
      .select('*')
      .like('agent_id', `${agentIdPrefix}%`);
    
    if (similarError) {
      console.error('❌ Erreur assignations similaires:', similarError);
    } else {
      console.log('✅ Assignations avec ID similaire:', similarAssignments?.length || 0);
      console.log('📋 Détails:', similarAssignments);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkAgentAndAssignments();
