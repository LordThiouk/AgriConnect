const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function debugAgentAssignmentsAndPlots() {
  console.log('🔍 Debug des assignations et parcelles de l\'agent...');
  
  try {
    // 1. Récupérer un agent existant
    console.log('\n1️⃣ Récupération d\'un agent existant...');
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('role', 'agent')
      .limit(1)
      .single();

    if (agentError || !agentProfile) {
      console.error('❌ Erreur lors de la récupération de l\'agent:', agentError?.message || 'Agent non trouvé');
      return;
    }
    console.log(`✅ Agent trouvé: ${agentProfile.display_name} (user_id: ${agentProfile.user_id})`);

    // 2. Vérifier les assignations de l'agent
    console.log('\n2️⃣ Vérification des assignations de l\'agent...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('*')
      .eq('agent_id', agentProfile.id);

    if (assignmentsError) {
      console.error('❌ Erreur lors de la récupération des assignations:', assignmentsError);
      return;
    }

    console.log(`📊 Assignations trouvées: ${assignments.length}`);
    const producerAssignments = assignments.filter(a => a.assigned_to_type === 'producer');
    console.log(`🌾 Assignations de producteurs: ${producerAssignments.length}`);

    if (producerAssignments.length > 0) {
      console.log('📋 Producteurs assignés:');
      producerAssignments.forEach(assignment => {
        console.log(`  - Producer ID: ${assignment.assigned_to_id}`);
      });
    }

    // 3. Récupérer les parcelles via le RPC
    console.log('\n3️⃣ Récupération des parcelles via RPC...');
    const { data: plots, error: plotsError } = await supabase.rpc('get_agent_plots_with_geolocation', {
      p_agent_user_id: agentProfile.user_id
    });

    if (plotsError) {
      console.error('❌ Erreur lors de la récupération des parcelles:', plotsError);
      return;
    }

    console.log(`📊 Parcelles trouvées via RPC: ${plots.length}`);
    if (plots.length > 0) {
      console.log('📋 Parcelles de l\'agent:');
      plots.forEach(plot => {
        console.log(`  - ID: ${plot.id}`);
        console.log(`  - Nom: ${plot.name_season_snapshot}`);
        console.log(`  - Producteur ID: ${plot.producer_id}`);
        console.log(`  - GPS: ${plot.has_gps}`);
        console.log('  ---');
      });
    }

    // 4. Récupérer les visites
    console.log('\n4️⃣ Récupération des visites...');
    const { data: visits, error: visitsError } = await supabase.rpc('get_agent_all_visits_with_filters', {
      p_user_id: agentProfile.user_id,
      p_filter: 'all'
    });

    if (visitsError) {
      console.error('❌ Erreur lors de la récupération des visites:', visitsError);
      return;
    }

    console.log(`📊 Visites trouvées: ${visits.length}`);
    if (visits.length > 0) {
      console.log('📋 Visites de l\'agent:');
      visits.forEach(visit => {
        console.log(`  - ID: ${visit.id}`);
        console.log(`  - Parcelle ID: ${visit.plot_id}`);
        console.log(`  - Parcelle nom: ${visit.plot_name}`);
        console.log(`  - Producteur ID: ${visit.producer_id}`);
        console.log(`  - GPS: ${visit.has_gps}`);
        console.log('  ---');
      });
    }

    // 5. Vérifier la correspondance
    console.log('\n5️⃣ Vérification de la correspondance...');
    const plotIds = plots.map(p => p.id);
    const visitPlotIds = visits.map(v => v.plot_id);
    
    console.log(`Parcelles de l'agent: ${plotIds.length}`);
    console.log(`Parcelles des visites: ${visitPlotIds.length}`);
    
    const commonPlotIds = plotIds.filter(id => visitPlotIds.includes(id));
    console.log(`Parcelles communes: ${commonPlotIds.length}`);
    
    if (commonPlotIds.length === 0) {
      console.log('❌ PROBLÈME: Aucune parcelle commune entre les assignations et les visites!');
      console.log('Cela explique pourquoi la navigation ne fonctionne pas.');
    } else {
      console.log('✅ Parcelles communes trouvées:', commonPlotIds);
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

debugAgentAssignmentsAndPlots();
