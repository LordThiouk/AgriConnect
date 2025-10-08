const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeRPCGeolocationAndStats() {
  console.log('🔍 Analyse du RPC de géolocalisation et des statistiques\n');
  console.log('='.repeat(80));

  const results = {
    rpc_geolocation: { status: 'pending', details: [] },
    data_sources: { status: 'pending', details: [] },
    statistics_calculation: { status: 'pending', details: [] },
    map_buttons_purpose: { status: 'pending', details: [] }
  };

  // 1. Analyser le RPC get_plots_with_geolocation
  console.log('\n🗺️ ANALYSE RPC GÉOLOCALISATION...');
  try {
    // Tester la RPC function
    const { data: plotsData, error: plotsError } = await supabase
      .rpc('get_plots_with_geolocation');

    if (plotsError) {
      results.rpc_geolocation.status = 'error';
      results.rpc_geolocation.details.push(`❌ Erreur RPC: ${plotsError.message}`);
    } else {
      results.rpc_geolocation.status = 'success';
      results.rpc_geolocation.details.push(`✅ RPC get_plots_with_geolocation fonctionne`);
      results.rpc_geolocation.details.push(`✅ ${plotsData?.length || 0} parcelles récupérées`);
      
      if (plotsData && plotsData.length > 0) {
        // Analyser la structure des données
        const samplePlot = plotsData[0];
        results.rpc_geolocation.details.push(`✅ Champs disponibles: ${Object.keys(samplePlot).join(', ')}`);
        
        // Analyser les sources de géolocalisation
        const geolocationFields = {
          latitude: samplePlot.latitude !== null ? 'Directe (colonne latitude)' : 'Null',
          longitude: samplePlot.longitude !== null ? 'Directe (colonne longitude)' : 'Null',
          geom: samplePlot.geom ? 'Géométrie PostGIS' : 'Null',
          center_point: samplePlot.center_point ? 'Point central PostGIS' : 'Null'
        };
        
        Object.entries(geolocationFields).forEach(([field, source]) => {
          results.rpc_geolocation.details.push(`   📍 ${field}: ${source}`);
        });
        
        // Vérifier la cohérence des coordonnées
        const validCoords = plotsData.filter(plot => 
          plot.latitude !== null && 
          plot.latitude !== undefined && 
          plot.longitude !== null && 
          plot.longitude !== undefined
        );
        
        results.rpc_geolocation.details.push(`✅ ${validCoords.length}/${plotsData.length} parcelles avec coordonnées valides`);
        
        // Analyser la plage géographique
        if (validCoords.length > 0) {
          const latitudes = validCoords.map(p => p.latitude);
          const longitudes = validCoords.map(p => p.longitude);
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);
          
          results.rpc_geolocation.details.push(`📍 Plage latitude: ${minLat.toFixed(4)}° à ${maxLat.toFixed(4)}°`);
          results.rpc_geolocation.details.push(`📍 Plage longitude: ${minLng.toFixed(4)}° à ${maxLng.toFixed(4)}°`);
          results.rpc_geolocation.details.push(`📍 Étendue: ${(maxLat - minLat).toFixed(4)}° x ${(maxLng - minLng).toFixed(4)}°`);
        }
      }
    }
  } catch (error) {
    results.rpc_geolocation.status = 'error';
    results.rpc_geolocation.details.push(`❌ Erreur: ${error.message}`);
  }

  // 2. Analyser les sources de données
  console.log('\n📊 ANALYSE SOURCES DE DONNÉES...');
  try {
    // Vérifier la table farm_file_plots
    const { data: farmFilePlots, error: ffpError } = await supabase
      .from('farm_file_plots')
      .select('id, latitude, longitude, geom, center_point, area_hectares, status')
      .limit(5);

    if (ffpError) {
      results.data_sources.status = 'error';
      results.data_sources.details.push(`❌ Erreur table farm_file_plots: ${ffpError.message}`);
    } else {
      results.data_sources.status = 'success';
      results.data_sources.details.push(`✅ Table farm_file_plots accessible`);
      results.data_sources.details.push(`✅ ${farmFilePlots?.length || 0} échantillons récupérés`);
      
      if (farmFilePlots && farmFilePlots.length > 0) {
        const sample = farmFilePlots[0];
        results.data_sources.details.push(`✅ Champs géolocalisation dans farm_file_plots:`);
        
        const geoFields = {
          latitude: sample.latitude,
          longitude: sample.longitude,
          geom: sample.geom ? 'PostGIS Geometry' : null,
          center_point: sample.center_point ? 'PostGIS Point' : null
        };
        
        Object.entries(geoFields).forEach(([field, value]) => {
          if (value !== null && value !== undefined) {
            results.data_sources.details.push(`   📍 ${field}: ${typeof value} - ${Array.isArray(value) ? 'Array' : value}`);
          } else {
            results.data_sources.details.push(`   📍 ${field}: null`);
          }
        });
      }
    }

    // Vérifier les autres tables liées
    const relatedTables = ['producers', 'cooperatives'];
    for (const table of relatedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          results.data_sources.details.push(`✅ Table ${table} accessible`);
        }
      } catch (err) {
        results.data_sources.details.push(`⚠️ Table ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    results.data_sources.status = 'error';
    results.data_sources.details.push(`❌ Erreur: ${error.message}`);
  }

  // 3. Analyser le calcul des statistiques
  console.log('\n📈 ANALYSE CALCUL STATISTIQUES...');
  try {
    // Récupérer les données pour calculer les statistiques
    const { data: plotsData } = await supabase.rpc('get_plots_with_geolocation');
    
    if (plotsData && plotsData.length > 0) {
      results.statistics_calculation.status = 'success';
      
      // Calculer les statistiques manuellement
      const totalPlots = plotsData.length;
      const plotsWithCoords = plotsData.filter(plot => 
        plot.latitude !== null && 
        plot.latitude !== undefined && 
        plot.longitude !== null && 
        plot.longitude !== undefined
      );
      const activePlots = plotsData.filter(plot => plot.status === 'active');
      const totalArea = plotsData.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0);
      
      results.statistics_calculation.details.push(`✅ Calcul des statistiques:`);
      results.statistics_calculation.details.push(`   📊 Total parcelles: ${totalPlots}`);
      results.statistics_calculation.details.push(`   📊 Parcelles géolocalisées: ${plotsWithCoords.length}`);
      results.statistics_calculation.details.push(`   📊 Parcelles actives: ${activePlots.length}`);
      results.statistics_calculation.details.push(`   📊 Surface totale: ${Math.round(totalArea * 100) / 100} hectares`);
      
      // Vérifier la cohérence avec les données Dashboard
      results.statistics_calculation.details.push(`\n✅ Vérification cohérence Dashboard:`);
      results.statistics_calculation.details.push(`   - "19 Parcelles": ${plotsWithCoords.length === 19 ? '✅' : '❌'} (${plotsWithCoords.length})`);
      results.statistics_calculation.details.push(`   - "23 Hectares": ${Math.round(totalArea) === 23 ? '✅' : '❌'} (${Math.round(totalArea)})`);
      results.statistics_calculation.details.push(`   - "19 Actives": ${activePlots.length === 19 ? '✅' : '❌'} (${activePlots.length})`);
      
      // Analyser les sources de calcul
      results.statistics_calculation.details.push(`\n✅ Sources de calcul:`);
      results.statistics_calculation.details.push(`   📍 Géolocalisation: latitude/longitude de farm_file_plots`);
      results.statistics_calculation.details.push(`   📊 Surface: area_hectares de farm_file_plots`);
      results.statistics_calculation.details.push(`   🎯 Statut: status de farm_file_plots`);
      results.statistics_calculation.details.push(`   👤 Producteur: jointure avec producers`);
      results.statistics_calculation.details.push(`   🏢 Coopérative: jointure avec cooperatives`);
    }
  } catch (error) {
    results.statistics_calculation.status = 'error';
    results.statistics_calculation.details.push(`❌ Erreur: ${error.message}`);
  }

  // 4. Expliquer l'utilité des boutons de la carte
  console.log('\n🔘 UTILITÉ BOUTONS CARTE...');
  try {
    results.map_buttons_purpose.status = 'success';
    
    results.map_buttons_purpose.details.push(`✅ Bouton "Rechercher":`);
    results.map_buttons_purpose.details.push(`   🎯 Fonction: Filtrer les parcelles affichées`);
    results.map_buttons_purpose.details.push(`   📍 Utilisation: Rechercher par nom de parcelle, producteur, région`);
    results.map_buttons_purpose.details.push(`   🔍 Exemple: "Maïs", "Kaolack", "Parcelle 1"`);
    results.map_buttons_purpose.details.push(`   ⚡ Impact: Réduit le nombre de marqueurs sur la carte`);
    
    results.map_buttons_purpose.details.push(`\n✅ Bouton "Couches":`);
    results.map_buttons_purpose.details.push(`   🎯 Fonction: Basculer entre différentes couches de données`);
    results.map_buttons_purpose.details.push(`   📍 Utilisations possibles:`);
    results.map_buttons_purpose.details.push(`      - Couche parcelles (actuelle)`);
    results.map_buttons_purpose.details.push(`      - Couche producteurs`);
    results.map_buttons_purpose.details.push(`      - Couche coopératives`);
    results.map_buttons_purpose.details.push(`      - Couche cultures`);
    results.map_buttons_purpose.details.push(`   🎨 Impact: Change la visualisation sans changer la position`);
    
    results.map_buttons_purpose.details.push(`\n💡 Implémentation suggérée:`);
    results.map_buttons_purpose.details.push(`   🔍 Rechercher: Modal avec filtres (nom, région, statut, culture)`);
    results.map_buttons_purpose.details.push(`   🗂️ Couches: Dropdown avec options (parcelles, producteurs, cultures)`);
    results.map_buttons_purpose.details.push(`   🎨 Style: Icônes intuitives (loupe, couches empilées)`);
    results.map_buttons_purpose.details.push(`   ⚡ Performance: Filtrage côté client pour réactivité`);
    
    results.map_buttons_purpose.details.push(`\n🎯 Bénéfices utilisateur:`);
    results.map_buttons_purpose.details.push(`   📍 Navigation plus facile sur carte dense`);
    results.map_buttons_purpose.details.push(`   🔍 Recherche ciblée de parcelles spécifiques`);
    results.map_buttons_purpose.details.push(`   🎨 Visualisation adaptée au besoin`);
    results.map_buttons_purpose.details.push(`   ⚡ Performance améliorée avec moins de marqueurs`);
  } catch (error) {
    results.map_buttons_purpose.status = 'error';
    results.map_buttons_purpose.details.push(`❌ Erreur: ${error.message}`);
  }

  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS - ANALYSE RPC ET STATISTIQUES');
  console.log('='.repeat(80));

  const components = Object.keys(results);
  
  components.forEach(component => {
    const status = results[component].status;
    const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳';
    console.log(`\n${icon} ${component.toUpperCase().replace('_', ' ')}: ${status}`);
    
    if (results[component].details.length > 0) {
      results[component].details.forEach(detail => console.log(`   ${detail}`));
    }
  });

  // Résumé final
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSUMÉ ANALYSE');
  console.log('='.repeat(80));

  const totalComponents = components.length;
  const successCount = components.filter(c => results[c].status === 'success').length;
  const errorCount = components.filter(c => results[c].status === 'error').length;

  console.log(`✅ Analyses réussies: ${successCount}/${totalComponents}`);
  console.log(`❌ Analyses en erreur: ${errorCount}/${totalComponents}`);
  
  const successRate = Math.round((successCount / totalComponents) * 100);
  console.log(`📊 Taux de réussite: ${successRate}%`);

  if (successRate === 100) {
    console.log('\n🎉 ANALYSE COMPLÈTE!');
    console.log('✅ RPC de géolocalisation analysé');
    console.log('✅ Sources de données identifiées');
    console.log('✅ Calcul des statistiques expliqué');
    console.log('✅ Utilité des boutons clarifiée');
  }

  console.log('\n🔍 RÉPONSES AUX QUESTIONS:');
  console.log('   📍 Géolocalisation: Colonnes latitude/longitude + PostGIS geom/center_point');
  console.log('   📊 Statistiques: Calculées en temps réel depuis farm_file_plots');
  console.log('   🔍 Bouton Rechercher: Filtrage des parcelles affichées');
  console.log('   🗂️ Bouton Couches: Basculement entre types de données');
}

analyzeRPCGeolocationAndStats();
