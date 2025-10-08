const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function createTestVisitsWithGPS() {
  console.log('🧪 Création de visites de test avec coordonnées GPS...');
  
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

    // 2. Récupérer des parcelles avec GPS
    console.log('\n2️⃣ Récupération de parcelles avec GPS...');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, producer_id, name_season_snapshot, center_point')
      .not('center_point', 'is', null)
      .limit(3);

    if (plotsError) {
      console.error('❌ Erreur lors de la récupération des parcelles:', plotsError);
      return;
    }

    if (!plots || plots.length === 0) {
      console.log('⚠️ Aucune parcelle avec GPS trouvée. Créons d\'abord des parcelles avec GPS...');
      
      // Créer des parcelles de test avec GPS
      const { data: producers, error: producersError } = await supabase
        .from('producers')
        .select('id')
        .limit(1);

      if (producersError || !producers || producers.length === 0) {
        console.error('❌ Aucun producteur trouvé pour créer des parcelles de test');
        return;
      }

      const testPlots = [
        {
          producer_id: producers[0].id,
          name_season_snapshot: 'Parcelle Test GPS 1',
          area_hectares: 2.5,
          soil_type: 'Argileux',
          water_source: 'Puits',
          status: 'active',
          center_point: 'POINT(-16.2512 14.6928)', // Dakar
          geom: 'POLYGON((-16.2512 14.6928, -16.2502 14.6928, -16.2502 14.6938, -16.2512 14.6938, -16.2512 14.6928))'
        },
        {
          producer_id: producers[0].id,
          name_season_snapshot: 'Parcelle Test GPS 2',
          area_hectares: 1.8,
          soil_type: 'Sableux',
          water_source: 'Forage',
          status: 'active',
          center_point: 'POINT(-16.2612 14.7028)', // Dakar + offset
          geom: 'POLYGON((-16.2612 14.7028, -16.2602 14.7028, -16.2602 14.7038, -16.2612 14.7038, -16.2612 14.7028))'
        }
      ];

      const { data: createdPlots, error: createPlotsError } = await supabase
        .from('plots')
        .insert(testPlots)
        .select('id, name_season_snapshot, center_point');

      if (createPlotsError) {
        console.error('❌ Erreur lors de la création des parcelles de test:', createPlotsError);
        return;
      }

      console.log(`✅ Parcelles de test créées: ${createdPlots.length}`);
      plots.push(...createdPlots);
    }

    console.log(`✅ Parcelles avec GPS trouvées: ${plots.length}`);

    // 3. Créer des visites de test
    console.log('\n3️⃣ Création de visites de test...');
    const testVisits = plots.map((plot, index) => ({
      agent_id: agentProfile.id,
      producer_id: plot.producer_id,
      plot_id: plot.id,
      visit_date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Aujourd'hui + index jours
      visit_type: 'routine',
      status: index === 0 ? 'completed' : 'scheduled',
      duration_minutes: 60,
      notes: `Visite de test ${index + 1} pour la parcelle ${plot.name_season_snapshot}`,
      weather_conditions: 'Ensoleillé'
    }));

    const { data: createdVisits, error: createVisitsError } = await supabase
      .from('visits')
      .insert(testVisits)
      .select('id, plot_id, visit_date, status');

    if (createVisitsError) {
      console.error('❌ Erreur lors de la création des visites de test:', createVisitsError);
      return;
    }

    console.log(`✅ Visites de test créées: ${createdVisits.length}`);

    // 4. Tester le RPC avec les nouvelles visites
    console.log('\n4️⃣ Test du RPC avec les nouvelles visites...');
    const { data: visits, error: rpcError } = await supabase.rpc('get_agent_all_visits_with_filters', {
      p_user_id: agentProfile.user_id,
      p_filter: 'all'
    });

    if (rpcError) {
      console.error('❌ Erreur lors de l\'appel RPC:', JSON.stringify(rpcError, null, 2));
      return;
    }

    if (visits && visits.length > 0) {
      console.log(`✅ RPC fonctionne ! Visites trouvées: ${visits.length}`);
      
      const visitsWithGPS = visits.filter(v => v.has_gps && v.lat && v.lon);
      console.log(`📍 Visites avec coordonnées GPS: ${visitsWithGPS.length}/${visits.length}`);
      
      if (visitsWithGPS.length > 0) {
        console.log('\n🎯 Exemple de visite avec coordonnées complètes:');
        const gpsVisit = visitsWithGPS[0];
        console.log(`  - Parcelle: ${gpsVisit.plot_name}`);
        console.log(`  - Coordonnées: ${gpsVisit.lat}, ${gpsVisit.lon}`);
        console.log(`  - GPS disponible: ${gpsVisit.has_gps}`);
        console.log(`  - URL de navigation: /(tabs)/parcelles?focusPlotId=${gpsVisit.plot_id}&centerLat=${gpsVisit.lat}&centerLng=${gpsVisit.lon}&zoom=18`);
      }
    } else {
      console.log('⚠️ Aucune visite trouvée après création.');
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

createTestVisitsWithGPS();
