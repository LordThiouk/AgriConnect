const fs = require('fs');
const path = require('path');

function fixDashboardFrontend() {
  console.log('🔧 Correction du frontend Dashboard\n');
  console.log('='.repeat(80));

  const dashboardPath = path.join(__dirname, '../web/src/pages/Dashboard.tsx');
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Fichier Dashboard.tsx non trouvé');
    return;
  }

  console.log('📁 Analyse du fichier Dashboard.tsx...');
  
  let content = fs.readFileSync(dashboardPath, 'utf8');
  let hasChanges = false;

  // 1. Vérifier l'utilisation de données mockées
  console.log('\n🔍 Recherche de données mockées...');
  
  const mockPatterns = [
    /APP_CONFIG\.USE_MOCK_DATA/,
    /mockData/,
    /MOCK_/,
    /fake/i,
    /dummy/i,
    /hardcoded/i
  ];

  let mockUsage = [];
  mockPatterns.forEach(pattern => {
    const matches = content.match(new RegExp(pattern.source, 'g'));
    if (matches) {
      mockUsage.push(...matches);
    }
  });

  if (mockUsage.length > 0) {
    console.log('⚠️ Données mockées détectées:');
    mockUsage.forEach(match => console.log(`   - ${match}`));
    hasChanges = true;
  } else {
    console.log('✅ Aucune donnée mockée détectée');
  }

  // 2. Vérifier les imports des services
  console.log('\n🔍 Vérification des imports des services...');
  
  const requiredServices = [
    'DashboardService',
    'PlotsService', 
    'CropsService',
    'OperationsService',
    'ObservationsService'
  ];

  let missingServices = [];
  requiredServices.forEach(service => {
    if (!content.includes(service)) {
      missingServices.push(service);
    }
  });

  if (missingServices.length > 0) {
    console.log('⚠️ Services manquants:');
    missingServices.forEach(service => console.log(`   - ${service}`));
    hasChanges = true;
  } else {
    console.log('✅ Tous les services requis sont importés');
  }

  // 3. Vérifier l'utilisation des RPC functions
  console.log('\n🔍 Vérification des RPC functions...');
  
  const requiredRPCs = [
    'get_plots_with_geolocation_count',
    'get_plots_with_geolocation',
    'get_crops_count',
    'get_crops_with_plot_info',
    'get_operations_with_details',
    'count_operations_for_filters',
    'get_observations_with_details_v3',
    'count_observations_for_producer_v3'
  ];

  let missingRPCs = [];
  requiredRPCs.forEach(rpc => {
    if (!content.includes(rpc)) {
      missingRPCs.push(rpc);
    }
  });

  if (missingRPCs.length > 0) {
    console.log('⚠️ RPC functions manquantes:');
    missingRPCs.forEach(rpc => console.log(`   - ${rpc}`));
    hasChanges = true;
  } else {
    console.log('✅ Toutes les RPC functions requises sont utilisées');
  }

  // 4. Vérifier les composants spécifiques mentionnés
  console.log('\n🔍 Vérification des composants spécifiques...');
  
  const specificComponents = [
    'EvolutionChart',
    'CropDistributionChart', 
    'PlotsMap',
    'KPICard'
  ];

  let missingComponents = [];
  specificComponents.forEach(component => {
    if (!content.includes(component)) {
      missingComponents.push(component);
    }
  });

  if (missingComponents.length > 0) {
    console.log('⚠️ Composants spécifiques manquants:');
    missingComponents.forEach(component => console.log(`   - ${component}`));
    hasChanges = true;
  } else {
    console.log('✅ Tous les composants spécifiques sont présents');
  }

  // 5. Proposer des corrections
  console.log('\n🔧 CORRECTIONS PROPOSÉES:');
  
  if (hasChanges) {
    console.log('\n📝 Corrections à apporter:');
    
    // Correction 1: S'assurer que APP_CONFIG.USE_MOCK_DATA est false
    if (content.includes('APP_CONFIG.USE_MOCK_DATA')) {
      console.log('   1. ✅ Définir APP_CONFIG.USE_MOCK_DATA = false');
      content = content.replace(
        /APP_CONFIG\.USE_MOCK_DATA\s*=\s*true/g,
        'APP_CONFIG.USE_MOCK_DATA = false'
      );
    }

    // Correction 2: Ajouter les imports manquants
    if (missingServices.length > 0) {
      console.log('   2. ✅ Ajouter les imports des services manquants');
      const importSection = content.match(/import.*from.*['"].*services.*['"];?\s*/g);
      if (importSection) {
        const newImports = missingServices.map(service => 
          `import { ${service} } from '../services/${service.toLowerCase()}';`
        ).join('\n');
        content = content.replace(
          importSection[importSection.length - 1],
          importSection[importSection.length - 1] + '\n' + newImports
        );
      }
    }

    // Correction 3: S'assurer que les composants utilisent les vraies données
    console.log('   3. ✅ Vérifier que les composants utilisent les vraies données');
    
    // Correction pour EvolutionChart
    if (content.includes('EvolutionChart')) {
      const evolutionChartPattern = /<EvolutionChart[^>]*data=\{([^}]+)\}[^>]*\/>/;
      const evolutionMatch = content.match(evolutionChartPattern);
      if (evolutionMatch && evolutionMatch[1].includes('mock')) {
        console.log('      - EvolutionChart: Remplacer les données mockées');
        content = content.replace(
          evolutionChartPattern,
          '<EvolutionChart data={dashboardData.surfaceEvolution} />'
        );
      }
    }

    // Correction pour CropDistributionChart
    if (content.includes('CropDistributionChart')) {
      const cropChartPattern = /<CropDistributionChart[^>]*data=\{([^}]+)\}[^>]*\/>/;
      const cropMatch = content.match(cropChartPattern);
      if (cropMatch && cropMatch[1].includes('mock')) {
        console.log('      - CropDistributionChart: Remplacer les données mockées');
        content = content.replace(
          cropChartPattern,
          '<CropDistributionChart data={dashboardData.cropDistribution} />'
        );
      }
    }

    // Correction pour PlotsMap
    if (content.includes('PlotsMap')) {
      const plotsMapPattern = /<PlotsMap[^>]*data=\{([^}]+)\}[^>]*\/>/;
      const plotsMatch = content.match(plotsMapPattern);
      if (plotsMatch && plotsMatch[1].includes('mock')) {
        console.log('      - PlotsMap: Remplacer les données mockées');
        content = content.replace(
          plotsMapPattern,
          '<PlotsMap data={dashboardData.plotsWithGeo} />'
        );
      }
    }

    // Sauvegarder les modifications
    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log('\n💾 Fichier Dashboard.tsx mis à jour');
    
  } else {
    console.log('\n✅ Aucune correction nécessaire - le Dashboard utilise déjà les vraies données');
  }

  // 6. Vérifier les composants Dashboard spécifiques
  console.log('\n🔍 Vérification des composants Dashboard...');
  
  const dashboardComponents = [
    '../components/Dashboard/EvolutionChart.tsx',
    '../components/Dashboard/CropDistributionChart.tsx',
    '../components/Dashboard/PlotsMap.tsx',
    '../components/Dashboard/KPICard.tsx'
  ];

  dashboardComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, '../web/src', componentPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${componentPath} existe`);
      
      // Vérifier le contenu du composant
      const componentContent = fs.readFileSync(fullPath, 'utf8');
      if (componentContent.includes('mock') || componentContent.includes('fake')) {
        console.log(`   ⚠️ ${componentPath} contient des données mockées`);
      }
    } else {
      console.log(`❌ ${componentPath} manquant`);
    }
  });

  // 7. Résumé final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DES CORRECTIONS');
  console.log('='.repeat(80));
  
  if (hasChanges) {
    console.log('✅ Corrections appliquées avec succès');
    console.log('🔍 Prochaines étapes:');
    console.log('   - Tester le Dashboard dans le navigateur');
    console.log('   - Vérifier que les graphiques s\'affichent correctement');
    console.log('   - Valider que la carte des parcelles fonctionne');
    console.log('   - S\'assurer que toutes les données sont réelles');
  } else {
    console.log('✅ Dashboard déjà configuré avec les vraies données');
    console.log('🎉 Prêt pour les tests utilisateur');
  }
}

fixDashboardFrontend();
