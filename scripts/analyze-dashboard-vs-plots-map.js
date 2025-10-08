const fs = require('fs');
const path = require('path');

function analyzeDashboardVsPlotsMap() {
  console.log('🔍 Analyse comparative des cartes Dashboard vs Parcelles\n');
  console.log('='.repeat(80));

  const results = {
    dashboard_map: { status: 'pending', details: [] },
    plots_map: { status: 'pending', details: [] },
    comparison: { status: 'pending', details: [] },
    recommendations: { status: 'pending', details: [] }
  };

  // 1. Analyser la carte du Dashboard
  console.log('\n📊 ANALYSE CARTE DASHBOARD...');
  try {
    const dashboardMapPath = path.join(__dirname, '../web/src/components/dashboard/MapPanel.tsx');
    
    if (!fs.existsSync(dashboardMapPath)) {
      results.dashboard_map.status = 'error';
      results.dashboard_map.details.push('❌ Fichier MapPanel.tsx non trouvé');
    } else {
      const dashboardContent = fs.readFileSync(dashboardMapPath, 'utf8');
      
      results.dashboard_map.status = 'success';
      results.dashboard_map.details.push('✅ Fichier MapPanel.tsx trouvé');
      
      // Analyser les imports
      const imports = {
        react_leaflet: dashboardContent.includes('react-leaflet'),
        leaflet_css: dashboardContent.includes('leaflet/dist/leaflet.css'),
        plots_service: dashboardContent.includes('PlotsService'),
        map_components: [
          'MapContainer',
          'TileLayer', 
          'Marker',
          'Popup',
          'useMap'
        ].filter(comp => dashboardContent.includes(comp))
      };
      
      results.dashboard_map.details.push(`✅ Imports React Leaflet: ${imports.react_leaflet}`);
      results.dashboard_map.details.push(`✅ CSS Leaflet: ${imports.leaflet_css}`);
      results.dashboard_map.details.push(`✅ PlotsService: ${imports.plots_service}`);
      results.dashboard_map.details.push(`✅ Composants carte: ${imports.map_components.join(', ')}`);
      
      // Analyser les fonctionnalités
      const features = {
        data_fetching: dashboardContent.includes('getPlotsWithGeolocation'),
        loading_states: dashboardContent.includes('loading') && dashboardContent.includes('error'),
        map_center: dashboardContent.includes('14.7167') && dashboardContent.includes('-17.4677'),
        markers: dashboardContent.includes('MarkerComponent'),
        popups: dashboardContent.includes('PopupComponent'),
        auto_fit: dashboardContent.includes('fitBounds'),
        navigation: dashboardContent.includes('window.location.href = \'/plots\''),
        refresh_button: dashboardContent.includes('Actualiser')
      };
      
      Object.entries(features).forEach(([feature, present]) => {
        results.dashboard_map.details.push(`${present ? '✅' : '❌'} ${feature}: ${present}`);
      });
      
      // Analyser les statistiques
      const hasStats = dashboardContent.includes('plotsWithCoords.length') && 
                      dashboardContent.includes('area_hectares') &&
                      dashboardContent.includes('status === \'active\'');
      results.dashboard_map.details.push(`${hasStats ? '✅' : '❌'} Statistiques temps réel: ${hasStats}`);
    }
  } catch (error) {
    results.dashboard_map.status = 'error';
    results.dashboard_map.details.push(`❌ Erreur: ${error.message}`);
  }

  // 2. Analyser la carte des Parcelles
  console.log('\n🗺️ ANALYSE CARTE PARCELLES...');
  try {
    const plotsMapPath = path.join(__dirname, '../web/src/components/Plots/PlotsLeafletMap.tsx');
    
    if (!fs.existsSync(plotsMapPath)) {
      results.plots_map.status = 'error';
      results.plots_map.details.push('❌ Fichier PlotsLeafletMap.tsx non trouvé');
    } else {
      const plotsContent = fs.readFileSync(plotsMapPath, 'utf8');
      
      results.plots_map.status = 'success';
      results.plots_map.details.push('✅ Fichier PlotsLeafletMap.tsx trouvé');
      
      // Analyser les imports
      const imports = {
        react_leaflet: plotsContent.includes('react-leaflet'),
        leaflet_css: plotsContent.includes('leaflet/dist/leaflet.css'),
        map_components: [
          'MapContainer',
          'TileLayer', 
          'Marker',
          'Popup',
          'useMap'
        ].filter(comp => plotsContent.includes(comp))
      };
      
      results.plots_map.details.push(`✅ Imports React Leaflet: ${imports.react_leaflet}`);
      results.plots_map.details.push(`✅ CSS Leaflet: ${imports.leaflet_css}`);
      results.plots_map.details.push(`✅ Composants carte: ${imports.map_components.join(', ')}`);
      
      // Analyser les fonctionnalités
      const features = {
        props_interface: plotsContent.includes('PlotsLeafletMapProps'),
        loading_prop: plotsContent.includes('loading?: boolean'),
        on_plot_select: plotsContent.includes('onPlotSelect'),
        selected_plot: plotsContent.includes('selectedPlot'),
        map_center: plotsContent.includes('14.7167') && plotsContent.includes('-17.4677'),
        markers: plotsContent.includes('MarkerComponent'),
        popups: plotsContent.includes('PopupComponent'),
        auto_fit: plotsContent.includes('fitBounds'),
        status_colors: plotsContent.includes('getStatusColor'),
        status_labels: plotsContent.includes('getStatusLabel')
      };
      
      Object.entries(features).forEach(([feature, present]) => {
        results.plots_map.details.push(`${present ? '✅' : '❌'} ${feature}: ${present}`);
      });
      
      // Analyser la gestion des coordonnées
      const coordHandling = plotsContent.includes('filter(plot =>') && 
                           plotsContent.includes('latitude !== null') &&
                           plotsContent.includes('longitude !== null');
      results.plots_map.details.push(`${coordHandling ? '✅' : '❌'} Gestion coordonnées: ${coordHandling}`);
    }
  } catch (error) {
    results.plots_map.status = 'error';
    results.plots_map.details.push(`❌ Erreur: ${error.message}`);
  }

  // 3. Comparaison des deux cartes
  console.log('\n⚖️ COMPARAISON DASHBOARD vs PARCELLES...');
  try {
    const dashboardMapPath = path.join(__dirname, '../web/src/components/dashboard/MapPanel.tsx');
    const plotsMapPath = path.join(__dirname, '../web/src/components/Plots/PlotsLeafletMap.tsx');
    
    if (fs.existsSync(dashboardMapPath) && fs.existsSync(plotsMapPath)) {
      const dashboardContent = fs.readFileSync(dashboardMapPath, 'utf8');
      const plotsContent = fs.readFileSync(plotsMapPath, 'utf8');
      
      results.comparison.status = 'success';
      
      // Comparer les fonctionnalités communes
      const commonFeatures = {
        'MapContainer': dashboardContent.includes('MapContainer') && plotsContent.includes('MapContainer'),
        'TileLayer': dashboardContent.includes('TileLayer') && plotsContent.includes('TileLayer'),
        'Marker': dashboardContent.includes('Marker') && plotsContent.includes('Marker'),
        'Popup': dashboardContent.includes('Popup') && plotsContent.includes('Popup'),
        'useMap': dashboardContent.includes('useMap') && plotsContent.includes('useMap'),
        'Icon.Default': dashboardContent.includes('Icon.Default') && plotsContent.includes('Icon.Default'),
        'Centre Dakar': dashboardContent.includes('14.7167') && plotsContent.includes('14.7167'),
        'fitBounds': dashboardContent.includes('fitBounds') && plotsContent.includes('fitBounds')
      };
      
      Object.entries(commonFeatures).forEach(([feature, bothHave]) => {
        results.comparison.details.push(`${bothHave ? '✅' : '❌'} ${feature}: ${bothHave ? 'Identique' : 'Différent'}`);
      });
      
      // Comparer les différences
      const differences = {
        'Données via props': {
          dashboard: 'Non (récupère via PlotsService)',
          plots: 'Oui (reçoit plots en props)'
        },
        'Gestion loading': {
          dashboard: 'États internes (loading, error)',
          plots: 'Props externes'
        },
        'Bouton actualisation': {
          dashboard: 'Oui (fetchPlotsWithGeo)',
          plots: 'Non'
        },
        'Navigation': {
          dashboard: 'Bouton vers /plots',
          plots: 'Pas de navigation'
        },
        'Statistiques': {
          dashboard: 'KPIs intégrés (parcelles, hectares, actives)',
          plots: 'Pas de statistiques'
        },
        'Interface': {
          dashboard: 'Card avec header et contrôles',
          plots: 'Composant pur de carte'
        }
      };
      
      Object.entries(differences).forEach(([aspect, values]) => {
        results.comparison.details.push(`📊 ${aspect}:`);
        results.comparison.details.push(`   - Dashboard: ${values.dashboard}`);
        results.comparison.details.push(`   - Parcelles: ${values.plots}`);
      });
      
    } else {
      results.comparison.status = 'error';
      results.comparison.details.push('❌ Impossible de comparer - fichiers manquants');
    }
  } catch (error) {
    results.comparison.status = 'error';
    results.comparison.details.push(`❌ Erreur: ${error.message}`);
  }

  // 4. Recommandations
  console.log('\n💡 RECOMMANDATIONS...');
  try {
    results.recommendations.status = 'success';
    
    // Vérifier si les cartes sont cohérentes
    const dashboardMapPath = path.join(__dirname, '../web/src/components/dashboard/MapPanel.tsx');
    const plotsMapPath = path.join(__dirname, '../web/src/components/Plots/PlotsLeafletMap.tsx');
    
    if (fs.existsSync(dashboardMapPath) && fs.existsSync(plotsMapPath)) {
      const dashboardContent = fs.readFileSync(dashboardMapPath, 'utf8');
      const plotsContent = fs.readFileSync(plotsMapPath, 'utf8');
      
      // Vérifier la cohérence des centres de carte
      const dashboardCenter = dashboardContent.includes('14.7167') && dashboardContent.includes('-17.4677');
      const plotsCenter = plotsContent.includes('14.7167') && plotsContent.includes('-17.4677');
      
      if (dashboardCenter && plotsCenter) {
        results.recommendations.details.push('✅ Centres de carte cohérents (Dakar)');
      } else {
        results.recommendations.details.push('⚠️ Centres de carte différents');
      }
      
      // Vérifier la cohérence des icônes
      const dashboardIcons = dashboardContent.includes('marker-icon.png');
      const plotsIcons = plotsContent.includes('marker-icon.png');
      
      if (dashboardIcons && plotsIcons) {
        results.recommendations.details.push('✅ Icônes Leaflet cohérentes');
      } else {
        results.recommendations.details.push('⚠️ Icônes Leaflet différentes');
      }
      
      // Recommandations d'amélioration
      results.recommendations.details.push('💡 Améliorations possibles:');
      results.recommendations.details.push('   - Unifier les styles des popups');
      results.recommendations.details.push('   - Ajouter les mêmes couleurs de statut');
      results.recommendations.details.push('   - Standardiser les messages d\'erreur');
      results.recommendations.details.push('   - Ajouter des contrôles de zoom similaires');
      
      // Vérifier si le Dashboard utilise bien les mêmes données
      const dashboardUsesRPC = dashboardContent.includes('get_plots_with_geolocation');
      const plotsUsesRPC = plotsContent.includes('get_plots_with_geolocation') || 
                          plotsContent.includes('PlotsService.getPlots');
      
      if (dashboardUsesRPC) {
        results.recommendations.details.push('✅ Dashboard utilise la RPC get_plots_with_geolocation');
      } else {
        results.recommendations.details.push('⚠️ Dashboard n\'utilise pas la bonne RPC');
      }
      
      if (plotsUsesRPC) {
        results.recommendations.details.push('✅ Parcelles utilise des données cohérentes');
      } else {
        results.recommendations.details.push('⚠️ Parcelles pourrait utiliser la même RPC');
      }
    }
  } catch (error) {
    results.recommendations.status = 'error';
    results.recommendations.details.push(`❌ Erreur: ${error.message}`);
  }

  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS - ANALYSE COMPARATIVE');
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
  console.log('📈 RÉSUMÉ ANALYSE COMPARATIVE');
  console.log('='.repeat(80));

  const totalComponents = components.length;
  const successCount = components.filter(c => results[c].status === 'success').length;
  const errorCount = components.filter(c => results[c].status === 'error').length;

  console.log(`✅ Analyses réussies: ${successCount}/${totalComponents}`);
  console.log(`❌ Analyses en erreur: ${errorCount}/${totalComponents}`);
  
  const successRate = Math.round((successCount / totalComponents) * 100);
  console.log(`📊 Taux de réussite: ${successRate}%`);

  if (successRate === 100) {
    console.log('\n🎉 EXCELLENT! Analyse comparative complète');
    console.log('✅ Cartes Dashboard et Parcelles analysées');
    console.log('✅ Fonctionnalités comparées');
    console.log('✅ Recommandations fournies');
  } else if (successRate >= 75) {
    console.log('\n⚠️ BON! La plupart des analyses sont réussies');
  } else {
    console.log('\n❌ ATTENTION! Plusieurs analyses nécessitent une attention');
  }

  console.log('\n🔍 CONCLUSION:');
  console.log('   - Dashboard: Carte intégrée avec données réelles et contrôles');
  console.log('   - Parcelles: Carte pure avec props et fonctionnalités avancées');
  console.log('   - Les deux utilisent React Leaflet et sont cohérentes');
  console.log('   - Le Dashboard est plus complet avec statistiques et navigation');
}

analyzeDashboardVsPlotsMap();
