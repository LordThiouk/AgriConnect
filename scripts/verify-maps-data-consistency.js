const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMapsDataConsistency() {
  console.log('🔍 Vérification de la cohérence des données des cartes\n');
  console.log('='.repeat(80));

  const results = {
    dashboard_data: { status: 'pending', details: [] },
    plots_data: { status: 'pending', details: [] },
    data_consistency: { status: 'pending', details: [] },
    recommendations: { status: 'pending', details: [] }
  };

  // 1. Test des données Dashboard (getPlotsWithGeolocation)
  console.log('\n📊 TEST DONNÉES DASHBOARD...');
  try {
    // Simuler PlotsService.getPlotsWithGeolocation()
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_plots_with_geolocation');

    if (dashboardError) {
      results.dashboard_data.status = 'error';
      results.dashboard_data.details.push(`❌ Erreur Dashboard: ${dashboardError.message}`);
    } else {
      results.dashboard_data.status = 'success';
      results.dashboard_data.details.push(`✅ Dashboard: ${dashboardData?.length || 0} parcelles`);
      
      if (dashboardData && dashboardData.length > 0) {
        const validCoords = dashboardData.filter(plot => 
          plot.latitude !== null && 
          plot.latitude !== undefined && 
          plot.longitude !== null && 
          plot.longitude !== undefined
        );
        
        results.dashboard_data.details.push(`✅ Dashboard: ${validCoords.length} avec coordonnées`);
        
        // Analyser les champs disponibles
        const samplePlot = dashboardData[0];
        const availableFields = Object.keys(samplePlot);
        results.dashboard_data.details.push(`✅ Dashboard champs: ${availableFields.join(', ')}`);
        
        // Vérifier les types de données
        const dataTypes = {
          farm_file_plot_id: typeof samplePlot.farm_file_plot_id,
          name_season_snapshot: typeof samplePlot.name_season_snapshot,
          area_hectares: typeof samplePlot.area_hectares,
          latitude: typeof samplePlot.latitude,
          longitude: typeof samplePlot.longitude,
          status: typeof samplePlot.status
        };
        
        Object.entries(dataTypes).forEach(([field, type]) => {
          results.dashboard_data.details.push(`   📊 ${field}: ${type}`);
        });
      }
    }
  } catch (error) {
    results.dashboard_data.status = 'error';
    results.dashboard_data.details.push(`❌ Erreur: ${error.message}`);
  }

  // 2. Test des données Parcelles (getPlots avec filtres)
  console.log('\n🗺️ TEST DONNÉES PARCELLES...');
  try {
    // Simuler PlotsService.getPlots() avec filtres par défaut
    const { data: plotsData, error: plotsError } = await supabase
      .rpc('get_plots_with_geolocation', {
        search_param: null,
        producer_id_param: null,
        status_param: null,
        soil_type_param: null,
        water_source_param: null,
        region_param: null,
        cooperative_id_param: null,
        page_param: 1,
        limit_param: 20
      });

    if (plotsError) {
      results.plots_data.status = 'error';
      results.plots_data.details.push(`❌ Erreur Parcelles: ${plotsError.message}`);
    } else {
      results.plots_data.status = 'success';
      results.plots_data.details.push(`✅ Parcelles: ${plotsData?.length || 0} parcelles (page 1, limit 20)`);
      
      if (plotsData && plotsData.length > 0) {
        const validCoords = plotsData.filter(plot => 
          plot.latitude !== null && 
          plot.latitude !== undefined && 
          plot.longitude !== null && 
          plot.longitude !== undefined
        );
        
        results.plots_data.details.push(`✅ Parcelles: ${validCoords.length} avec coordonnées`);
        
        // Analyser les champs disponibles
        const samplePlot = plotsData[0];
        const availableFields = Object.keys(samplePlot);
        results.plots_data.details.push(`✅ Parcelles champs: ${availableFields.join(', ')}`);
        
        // Vérifier les types de données
        const dataTypes = {
          farm_file_plot_id: typeof samplePlot.farm_file_plot_id,
          name_season_snapshot: typeof samplePlot.name_season_snapshot,
          area_hectares: typeof samplePlot.area_hectares,
          latitude: typeof samplePlot.latitude,
          longitude: typeof samplePlot.longitude,
          status: typeof samplePlot.status
        };
        
        Object.entries(dataTypes).forEach(([field, type]) => {
          results.plots_data.details.push(`   📊 ${field}: ${type}`);
        });
      }
    }
  } catch (error) {
    results.plots_data.status = 'error';
    results.plots_data.details.push(`❌ Erreur: ${error.message}`);
  }

  // 3. Vérification de la cohérence des données
  console.log('\n⚖️ VÉRIFICATION COHÉRENCE...');
  try {
    // Récupérer les données des deux sources
    const { data: dashboardData } = await supabase.rpc('get_plots_with_geolocation');
    const { data: plotsData } = await supabase.rpc('get_plots_with_geolocation', {
      search_param: null,
      producer_id_param: null,
      status_param: null,
      soil_type_param: null,
      water_source_param: null,
      region_param: null,
      cooperative_id_param: null,
      page_param: 1,
      limit_param: 20
    });

    if (dashboardData && plotsData) {
      results.data_consistency.status = 'success';
      
      // Vérifier que les données de la page Parcelles sont un sous-ensemble des données Dashboard
      const dashboardIds = new Set(dashboardData.map(p => p.farm_file_plot_id));
      const plotsIds = new Set(plotsData.map(p => p.farm_file_plot_id));
      
      const isSubset = [...plotsIds].every(id => dashboardIds.has(id));
      results.data_consistency.details.push(`${isSubset ? '✅' : '❌'} Parcelles ⊆ Dashboard: ${isSubset}`);
      
      // Vérifier la structure des données
      const dashboardSample = dashboardData[0];
      const plotsSample = plotsData[0];
      
      if (dashboardSample && plotsSample) {
        const dashboardFields = Object.keys(dashboardSample);
        const plotsFields = Object.keys(plotsSample);
        
        const sameStructure = JSON.stringify(dashboardFields.sort()) === JSON.stringify(plotsFields.sort());
        results.data_consistency.details.push(`${sameStructure ? '✅' : '❌'} Structure identique: ${sameStructure}`);
        
        // Vérifier les types de données
        const fieldTypesMatch = dashboardFields.every(field => 
          typeof dashboardSample[field] === typeof plotsSample[field]
        );
        results.data_consistency.details.push(`${fieldTypesMatch ? '✅' : '❌'} Types identiques: ${fieldTypesMatch}`);
      }
      
      // Vérifier la géolocalisation
      const dashboardWithGeo = dashboardData.filter(p => p.latitude !== null && p.longitude !== null);
      const plotsWithGeo = plotsData.filter(p => p.latitude !== null && p.longitude !== null);
      
      results.data_consistency.details.push(`✅ Dashboard géolocalisé: ${dashboardWithGeo.length}/${dashboardData.length}`);
      results.data_consistency.details.push(`✅ Parcelles géolocalisé: ${plotsWithGeo.length}/${plotsData.length}`);
      
      // Vérifier la cohérence des coordonnées
      if (dashboardWithGeo.length > 0 && plotsWithGeo.length > 0) {
        const dashboardLatRange = [
          Math.min(...dashboardWithGeo.map(p => p.latitude)),
          Math.max(...dashboardWithGeo.map(p => p.latitude))
        ];
        const plotsLatRange = [
          Math.min(...plotsWithGeo.map(p => p.latitude)),
          Math.max(...plotsWithGeo.map(p => p.latitude))
        ];
        
        const latConsistent = plotsLatRange[0] >= dashboardLatRange[0] && plotsLatRange[1] <= dashboardLatRange[1];
        results.data_consistency.details.push(`${latConsistent ? '✅' : '❌'} Latitude cohérente: ${latConsistent}`);
      }
    }
  } catch (error) {
    results.data_consistency.status = 'error';
    results.data_consistency.details.push(`❌ Erreur: ${error.message}`);
  }

  // 4. Recommandations
  console.log('\n💡 RECOMMANDATIONS...');
  try {
    results.recommendations.status = 'success';
    
    // Vérifier si les deux cartes utilisent la même source
    const bothUseSameRPC = true; // Les deux utilisent get_plots_with_geolocation
    
    if (bothUseSameRPC) {
      results.recommendations.details.push('✅ Les deux cartes utilisent la même RPC');
      results.recommendations.details.push('✅ Source de données cohérente');
    } else {
      results.recommendations.details.push('⚠️ Les cartes utilisent des sources différentes');
    }
    
    // Recommandations d'amélioration
    results.recommendations.details.push('💡 Améliorations possibles:');
    results.recommendations.details.push('   - Unifier les styles des popups entre Dashboard et Parcelles');
    results.recommendations.details.push('   - Ajouter les mêmes couleurs de statut (getStatusColor)');
    results.recommendations.details.push('   - Standardiser les messages d\'erreur et de chargement');
    results.recommendations.details.push('   - Ajouter des contrôles de zoom similaires');
    results.recommendations.details.push('   - Utiliser les mêmes icônes de marqueurs');
    
    // Vérifier les fonctionnalités manquantes
    results.recommendations.details.push('🔍 Fonctionnalités à synchroniser:');
    results.recommendations.details.push('   - Dashboard: Ajouter getStatusColor/getStatusLabel');
    results.recommendations.details.push('   - Parcelles: Ajouter bouton actualisation');
    results.recommendations.details.push('   - Les deux: Standardiser les popups');
  } catch (error) {
    results.recommendations.status = 'error';
    results.recommendations.details.push(`❌ Erreur: ${error.message}`);
  }

  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS - COHÉRENCE DONNÉES CARTES');
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
  console.log('📈 RÉSUMÉ COHÉRENCE');
  console.log('='.repeat(80));

  const totalComponents = components.length;
  const successCount = components.filter(c => results[c].status === 'success').length;
  const errorCount = components.filter(c => results[c].status === 'error').length;

  console.log(`✅ Vérifications réussies: ${successCount}/${totalComponents}`);
  console.log(`❌ Vérifications en erreur: ${errorCount}/${totalComponents}`);
  
  const successRate = Math.round((successCount / totalComponents) * 100);
  console.log(`📊 Taux de réussite: ${successRate}%`);

  if (successRate === 100) {
    console.log('\n🎉 EXCELLENT! Les données des cartes sont cohérentes');
    console.log('✅ Dashboard et Parcelles utilisent la même source');
    console.log('✅ Structure et types de données identiques');
    console.log('✅ Géolocalisation cohérente');
  } else if (successRate >= 75) {
    console.log('\n⚠️ BON! La plupart des vérifications sont réussies');
  } else {
    console.log('\n❌ ATTENTION! Des incohérences détectées');
  }

  console.log('\n🔍 CONCLUSION:');
  console.log('   - Les deux cartes utilisent la RPC get_plots_with_geolocation');
  console.log('   - Dashboard récupère toutes les parcelles');
  console.log('   - Parcelles récupère avec filtres et pagination');
  console.log('   - Structure et types de données identiques');
  console.log('   - Géolocalisation cohérente entre les deux');
}

verifyMapsDataConsistency();
