const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugGpsDisplay() {
  console.log('🔍 Debug de l\'affichage GPS dans les visites');
  console.log('='.repeat(50));

  try {
    const agentUserId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    
    // Récupérer les visites avec les détails GPS
    console.log('\n1. 📱 Récupération des visites avec détails GPS:');
    const { data: visits, error: visitsError } = await supabase.rpc('get_agent_all_visits_with_filters', {
      p_user_id: agentUserId,
      p_filter: 'all'
    });

    if (visitsError) {
      console.error('❌ Erreur récupération visites:', visitsError);
      return;
    }

    const count = visits?.length || 0;
    console.log(`✅ ${count} visites récupérées`);

    if (count > 0) {
      console.log('\n2. 🔍 Analyse des données GPS:');
      console.log('='.repeat(50));
      
      visits.forEach((visit, index) => {
        console.log(`\n${index + 1}. Visite ${visit.id?.substring(0, 8)}...:`);
        console.log(`   Producteur: ${visit.producer}`);
        console.log(`   Parcelle: ${visit.plot_name}`);
        console.log(`   Superficie: ${visit.plot_area} ha`);
        console.log(`   has_gps: ${visit.has_gps} (type: ${typeof visit.has_gps})`);
        console.log(`   plot_id: ${visit.plot_id}`);
        
        // Vérifier les données de parcelle directement
        if (visit.plot_id) {
          console.log(`   🔍 Vérification parcelle ${visit.plot_id.substring(0, 8)}...`);
        }
      });

      // Vérifier spécifiquement la parcelle "Parcelle B2 - Légumes"
      const legumeVisit = visits.find(v => v.plot_name && v.plot_name.includes('Légumes'));
      if (legumeVisit) {
        console.log('\n3. 🌾 Analyse spécifique de "Parcelle B2 - Légumes":');
        console.log('='.repeat(50));
        console.log(`   ID: ${legumeVisit.id}`);
        console.log(`   Producteur: ${legumeVisit.producer}`);
        console.log(`   Parcelle: ${legumeVisit.plot_name}`);
        console.log(`   Superficie: ${legumeVisit.plot_area} ha`);
        console.log(`   has_gps: ${legumeVisit.has_gps}`);
        console.log(`   plot_id: ${legumeVisit.plot_id}`);
        console.log(`   status: ${legumeVisit.status}`);
        console.log(`   visit_date: ${legumeVisit.visit_date}`);
        
        // Vérifier les données de la parcelle dans la base
        if (legumeVisit.plot_id) {
          console.log('\n4. 🔍 Vérification directe de la parcelle:');
          supabase
            .from('plots')
            .select('id, name_season_snapshot, geom, center_point, area_hectares')
            .eq('id', legumeVisit.plot_id)
            .single()
            .then(({ data: plot, error: plotError }) => {
              if (plotError) {
                console.error('❌ Erreur récupération parcelle:', plotError);
              } else {
                console.log('✅ Données de parcelle:');
                console.log(`   Nom: ${plot.name_season_snapshot}`);
                console.log(`   Superficie: ${plot.area_hectares} ha`);
                console.log(`   Géométrie: ${plot.geom ? 'Présente' : 'Absente'}`);
                console.log(`   Centre: ${plot.center_point ? 'Présent' : 'Absent'}`);
                console.log(`   Type géométrie: ${typeof plot.geom}`);
                console.log(`   Type centre: ${typeof plot.center_point}`);
              }
            });
        }
      }

      // Statistiques GPS
      console.log('\n5. 📊 Statistiques GPS:');
      console.log('='.repeat(50));
      
      const visitsWithGps = visits.filter(v => v.has_gps === true);
      const visitsWithoutGps = visits.filter(v => v.has_gps === false);
      const visitsWithNullGps = visits.filter(v => v.has_gps === null || v.has_gps === undefined);
      
      console.log(`   Visites avec GPS: ${visitsWithGps.length}`);
      console.log(`   Visites sans GPS: ${visitsWithoutGps.length}`);
      console.log(`   Visites GPS null/undefined: ${visitsWithNullGps.length}`);
      
      if (visitsWithGps.length > 0) {
        console.log('\n   Visites avec GPS:');
        visitsWithGps.forEach(v => {
          console.log(`     - ${v.producer}: ${v.plot_name} (${v.plot_area} ha)`);
        });
      }
      
      if (visitsWithoutGps.length > 0) {
        console.log('\n   Visites sans GPS:');
        visitsWithoutGps.forEach(v => {
          console.log(`     - ${v.producer}: ${v.plot_name} (${v.plot_area} ha)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugGpsDisplay();
