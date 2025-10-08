const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPlotDataStructure() {
  console.log('🔍 Debug de la structure des données de parcelles\n');
  console.log('='.repeat(80));

  try {
    // Récupérer les données via RPC
    const { data: plotsData, error: plotsError } = await supabase
      .rpc('get_plots_with_geolocation');

    if (plotsError) {
      console.error('❌ Erreur RPC:', plotsError.message);
      return;
    }

    console.log(`✅ ${plotsData?.length || 0} parcelles récupérées\n`);

    if (plotsData && plotsData.length > 0) {
      // Analyser la première parcelle pour voir tous les champs disponibles
      const firstPlot = plotsData[0];
      
      console.log('📊 STRUCTURE COMPLÈTE DES DONNÉES:');
      console.log('='.repeat(50));
      Object.entries(firstPlot).forEach(([key, value]) => {
        const type = typeof value;
        const displayValue = value === null ? 'null' : 
                           value === undefined ? 'undefined' : 
                           Array.isArray(value) ? `Array(${value.length})` :
                           type === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` :
                           value;
        console.log(`   ${key}: ${displayValue} (${type})`);
      });

      console.log('\n🔍 ANALYSE DES CHAMPS DE NOM:');
      console.log('='.repeat(50));
      
      // Vérifier tous les champs qui pourraient contenir le nom
      const nameFields = ['name', 'name_season_snapshot', 'plot_name', 'title', 'label'];
      nameFields.forEach(field => {
        const hasField = firstPlot.hasOwnProperty(field);
        const value = hasField ? firstPlot[field] : 'N/A';
        console.log(`   ${hasField ? '✅' : '❌'} ${field}: ${value}`);
      });

      console.log('\n📈 ANALYSE DE TOUTES LES PARCELLES:');
      console.log('='.repeat(50));
      
      // Analyser les champs sur toutes les parcelles
      const fieldAnalysis = {};
      plotsData.forEach(plot => {
        Object.keys(plot).forEach(key => {
          if (!fieldAnalysis[key]) {
            fieldAnalysis[key] = {
              total: 0,
              nonNull: 0,
              nonEmpty: 0,
              samples: []
            };
          }
          
          fieldAnalysis[key].total++;
          if (plot[key] !== null && plot[key] !== undefined) {
            fieldAnalysis[key].nonNull++;
            if (typeof plot[key] === 'string' && plot[key].trim() !== '') {
              fieldAnalysis[key].nonEmpty++;
            }
          }
          
          // Garder quelques échantillons
          if (fieldAnalysis[key].samples.length < 3 && plot[key] !== null && plot[key] !== undefined && plot[key] !== '') {
            fieldAnalysis[key].samples.push(plot[key]);
          }
        });
      });

      // Afficher l'analyse des champs
      Object.entries(fieldAnalysis).forEach(([field, stats]) => {
        const nonNullPercent = Math.round((stats.nonNull / stats.total) * 100);
        const nonEmptyPercent = Math.round((stats.nonEmpty / stats.total) * 100);
        
        console.log(`\n📊 ${field}:`);
        console.log(`   Total: ${stats.total}`);
        console.log(`   Non-null: ${stats.nonNull} (${nonNullPercent}%)`);
        console.log(`   Non-empty: ${stats.nonEmpty} (${nonEmptyPercent}%)`);
        if (stats.samples.length > 0) {
          console.log(`   Échantillons: ${stats.samples.join(', ')}`);
        }
      });

      console.log('\n🎯 RECOMMANDATIONS:');
      console.log('='.repeat(50));
      
      // Trouver le meilleur champ pour le nom
      const nameCandidates = ['name_season_snapshot', 'name', 'plot_name'];
      let bestNameField = null;
      let bestScore = 0;
      
      nameCandidates.forEach(field => {
        if (fieldAnalysis[field]) {
          const score = fieldAnalysis[field].nonEmpty;
          console.log(`   ${field}: ${score} parcelles avec données (score: ${score})`);
          if (score > bestScore) {
            bestScore = score;
            bestNameField = field;
          }
        }
      });
      
      if (bestNameField && bestScore > 0) {
        console.log(`\n✅ MEILLEUR CHAMP POUR LE NOM: ${bestNameField} (${bestScore} parcelles)`);
      } else {
        console.log('\n⚠️ AUCUN CHAMP DE NOM TROUVÉ - Utilisation d\'un nom généré');
      }

      // Vérifier les champs de géolocalisation
      console.log('\n📍 GÉOLOCALISATION:');
      console.log('='.repeat(50));
      const geoFields = ['latitude', 'longitude', 'geom', 'center_point'];
      geoFields.forEach(field => {
        if (fieldAnalysis[field]) {
          const stats = fieldAnalysis[field];
          console.log(`   ${field}: ${stats.nonNull}/${stats.total} (${Math.round((stats.nonNull/stats.total)*100)}%)`);
        }
      });

    } else {
      console.log('❌ Aucune donnée de parcelle trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugPlotDataStructure();
