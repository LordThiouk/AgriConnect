const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugVisitsFilterAll() {
  console.log('🔍 Debug des visites avec filtre "all"');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier l'agent de test
    console.log('\n1. Vérification de l\'agent:');
    const { data: agent, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('user_id', 'b00a283f-0a46-41d2-af95-8a256c9c2771')
      .single();

    if (agentError) {
      console.error('❌ Erreur agent:', agentError);
      return;
    }
    console.log('✅ Agent trouvé:', agent);

    // 2. Vérifier les visites de cet agent
    console.log('\n2. Visites de l\'agent:');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .eq('agent_id', agent.id);

    if (visitsError) {
      console.error('❌ Erreur visites:', visitsError);
      return;
    }
    console.log(`✅ ${visits.length} visites trouvées:`, visits.map(v => ({
      id: v.id,
      producer_id: v.producer_id,
      plot_id: v.plot_id,
      visit_date: v.visit_date,
      status: v.status
    })));

    // 3. Tester le RPC get_agent_all_visits_with_filters
    console.log('\n3. Test du RPC get_agent_all_visits_with_filters:');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_agent_all_visits_with_filters', {
        p_agent_id: agent.user_id,
        p_filter: 'all'
      });

    if (rpcError) {
      console.error('❌ Erreur RPC:', rpcError);
      return;
    }
    console.log(`✅ RPC retourne ${rpcData.length} visites:`, rpcData);

    // 4. Vérifier les producteurs assignés
    console.log('\n4. Producteurs assignés à l\'agent:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('producer_id')
      .eq('agent_id', agent.id);

    if (assignmentsError) {
      console.error('❌ Erreur assignments:', assignmentsError);
      return;
    }
    console.log(`✅ ${assignments.length} assignments trouvés:`, assignments);

    // 5. Vérifier les producteurs
    if (assignments.length > 0) {
      console.log('\n5. Détails des producteurs assignés:');
      const producerIds = assignments.map(a => a.producer_id);
      const { data: producers, error: producersError } = await supabase
        .from('producers')
        .select('id, first_name, last_name')
        .in('id', producerIds);

      if (producersError) {
        console.error('❌ Erreur producteurs:', producersError);
        return;
      }
      console.log(`✅ ${producers.length} producteurs trouvés:`, producers);
    }

    // 6. Vérifier les parcelles
    if (visits.length > 0) {
      console.log('\n6. Détails des parcelles des visites:');
      const plotIds = visits.map(v => v.plot_id).filter(Boolean);
      if (plotIds.length > 0) {
        const { data: plots, error: plotsError } = await supabase
          .from('plots')
          .select('id, name_season_snapshot, area_hectares')
          .in('id', plotIds);

        if (plotsError) {
          console.error('❌ Erreur parcelles:', plotsError);
          return;
        }
        console.log(`✅ ${plots.length} parcelles trouvées:`, plots);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugVisitsFilterAll();
