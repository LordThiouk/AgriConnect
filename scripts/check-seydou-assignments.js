const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function checkSeydouAssignments() {
  console.log('🔍 Vérification des assignations de l\'agent Seydou Sene...');
  
  try {
    // 1. Récupérer l'agent Seydou Sene
    console.log('\n1️⃣ Recherche de l\'agent Seydou Sene...');
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('role', 'agent')
      .ilike('display_name', '%Seydou%')
      .limit(1)
      .single();

    if (agentError || !agentProfile) {
      console.error('❌ Agent Seydou Sene non trouvé:', agentError?.message || 'Agent non trouvé');
      
      // Lister tous les agents disponibles
      console.log('\n🔍 Agents disponibles:');
      const { data: allAgents, error: allAgentsError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, role')
        .eq('role', 'agent');
      
      if (!allAgentsError && allAgents) {
        allAgents.forEach(agent => {
          console.log(`  - ${agent.display_name} (user_id: ${agent.user_id})`);
        });
      }
      return;
    }
    console.log(`✅ Agent trouvé: ${agentProfile.display_name} (user_id: ${agentProfile.user_id})`);

    // 2. Vérifier les assignations de l'agent
    console.log('\n2️⃣ Vérification des assignations...');
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
      for (const assignment of producerAssignments) {
        console.log(`  - Producer ID: ${assignment.assigned_to_id}`);
        
        // Récupérer les détails du producteur
        const { data: producer, error: producerError } = await supabase
          .from('producers')
          .select('id, first_name, last_name')
          .eq('id', assignment.assigned_to_id)
          .single();
        
        if (!producerError && producer) {
          console.log(`    Nom: ${producer.first_name} ${producer.last_name}`);
        }
      }
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
        console.log(`  - Center point: ${plot.center_point}`);
        console.log('  ---');
      });
    }

    // 4. Récupérer les visites existantes
    console.log('\n4️⃣ Récupération des visites existantes...');
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
        console.log(`  - Coordonnées: ${visit.lat}, ${visit.lon}`);
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
      
      // Tester la navigation pour une visite avec GPS
      const visitWithGPS = visits.find(v => v.has_gps && v.lat && v.lon && commonPlotIds.includes(v.plot_id));
      if (visitWithGPS) {
        console.log('\n🎯 Test de navigation possible:');
        console.log(`  - Visite ID: ${visitWithGPS.id}`);
        console.log(`  - Parcelle: ${visitWithGPS.plot_name}`);
        console.log(`  - Coordonnées: ${visitWithGPS.lat}, ${visitWithGPS.lon}`);
        console.log(`  - URL: /(tabs)/parcelles?focusPlotId=${visitWithGPS.plot_id}&centerLat=${visitWithGPS.lat}&centerLng=${visitWithGPS.lon}&zoom=18`);
      }
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

checkSeydouAssignments();
