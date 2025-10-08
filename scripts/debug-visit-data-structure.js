const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function debugVisitDataStructure() {
  console.log('🔍 Debug de la structure des données de visite...');
  
  try {
    // 1. Récupérer l'agent Seydou Sene
    console.log('\n1️⃣ Récupération de l\'agent Seydou Sene...');
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('role', 'agent')
      .ilike('display_name', '%Seydou%')
      .limit(1)
      .single();

    if (agentError || !agentProfile) {
      console.error('❌ Agent Seydou Sene non trouvé:', agentError?.message || 'Agent non trouvé');
      return;
    }
    console.log(`✅ Agent trouvé: ${agentProfile.display_name} (user_id: ${agentProfile.user_id})`);

    // 2. Récupérer les visites via le RPC
    console.log('\n2️⃣ Récupération des visites via RPC...');
    const { data: visits, error: visitsError } = await supabase.rpc('get_agent_all_visits_with_filters', {
      p_user_id: agentProfile.user_id,
      p_filter: 'all'
    });

    if (visitsError) {
      console.error('❌ Erreur lors de l\'appel RPC:', visitsError);
      return;
    }

    if (!visits || visits.length === 0) {
      console.log('⚠️ Aucune visite trouvée.');
      return;
    }

    console.log(`📊 Visites trouvées: ${visits.length}`);

    // 3. Analyser la structure des données de visite
    console.log('\n3️⃣ Analyse de la structure des données de visite...');
    const visitWithGPS = visits.find(v => v.has_gps && v.lat && v.lon);
    
    if (visitWithGPS) {
      console.log('🎯 Visite avec GPS trouvée:');
      console.log('📋 Structure complète des données:');
      console.log(JSON.stringify(visitWithGPS, null, 2));
      
      console.log('\n🔍 Champs clés pour la navigation:');
      console.log(`  - id: ${visitWithGPS.id}`);
      console.log(`  - plot_id: ${visitWithGPS.plot_id}`);
      console.log(`  - plot_name: ${visitWithGPS.plot_name}`);
      console.log(`  - lat: ${visitWithGPS.lat}`);
      console.log(`  - lon: ${visitWithGPS.lon}`);
      console.log(`  - has_gps: ${visitWithGPS.has_gps}`);
      
      // 4. Vérifier si plot_id existe
      if (visitWithGPS.plot_id) {
        console.log('✅ plot_id trouvé dans les données de visite');
        
        // 5. Simuler la navigation
        console.log('\n4️⃣ Simulation de la navigation...');
        const navigationParams = {
          focusPlotId: visitWithGPS.plot_id,
          centerLat: visitWithGPS.lat.toString(),
          centerLng: visitWithGPS.lon.toString(),
          zoom: '18'
        };
        
        console.log('📱 Paramètres de navigation:');
        console.log(JSON.stringify(navigationParams, null, 2));
        
        // 6. Vérifier que la parcelle existe
        console.log('\n5️⃣ Vérification de l\'existence de la parcelle...');
        const { data: plots, error: plotsError } = await supabase.rpc('get_agent_plots_with_geolocation', {
          p_agent_user_id: agentProfile.user_id
        });

        if (plotsError) {
          console.error('❌ Erreur lors de la récupération des parcelles:', plotsError);
          return;
        }

        const targetPlot = plots.find(p => p.id === visitWithGPS.plot_id);
        if (targetPlot) {
          console.log('✅ Parcelle trouvée dans les parcelles de l\'agent:');
          console.log(`  - ID: ${targetPlot.id}`);
          console.log(`  - Nom: ${targetPlot.name_season_snapshot}`);
          console.log(`  - GPS: ${targetPlot.has_gps}`);
          
          console.log('\n✅ La navigation devrait fonctionner correctement!');
        } else {
          console.log('❌ PROBLÈME: La parcelle de la visite n\'est pas trouvée dans les parcelles de l\'agent');
        }
        
      } else {
        console.log('❌ PROBLÈME: plot_id manquant dans les données de visite');
        console.log('Champs disponibles:', Object.keys(visitWithGPS));
      }
      
    } else {
      console.log('⚠️ Aucune visite avec GPS trouvée.');
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

debugVisitDataStructure();
