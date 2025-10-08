const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlotsStructure() {
  console.log('🔍 Vérification de la structure de la table plots');
  console.log('='.repeat(50));

  try {
    // Récupérer un échantillon de parcelles
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .limit(3);

    if (plotsError) {
      console.error('❌ Erreur récupération parcelles:', plotsError);
      return;
    }

    if (!plots || plots.length === 0) {
      console.log('⚠️ Aucune parcelle trouvée');
      return;
    }

    console.log('✅ Parcelles trouvées:', plots.length);
    console.log('\n📋 Structure de la table plots:');
    console.log('='.repeat(40));
    
    const samplePlot = plots[0];
    Object.keys(samplePlot).forEach(key => {
      const value = samplePlot[key];
      const type = typeof value;
      console.log(`   ${key.padEnd(25)}: ${type} = ${value}`);
    });

    console.log('\n🌾 Exemples de parcelles:');
    console.log('='.repeat(40));
    
    plots.forEach((plot, index) => {
      console.log(`\n${index + 1}. Parcelle ${plot.id?.substring(0, 8)}...:`);
      console.log(`   Nom: ${plot.name_season_snapshot || 'N/A'}`);
      console.log(`   Superficie: ${plot.area_hectares || 'N/A'} ha`);
      console.log(`   Type de sol: ${plot.soil_type || 'N/A'}`);
      console.log(`   Source d'eau: ${plot.water_source || 'N/A'}`);
      console.log(`   Statut: ${plot.status || 'N/A'}`);
      console.log(`   GPS: ${plot.geom ? 'Oui' : 'Non'}`);
      console.log(`   Centre: ${plot.center_point ? 'Oui' : 'Non'}`);
      console.log(`   Producteur: ${plot.producer_id?.substring(0, 8)}...`);
    });

    // Vérifier les colonnes de localisation
    console.log('\n📍 Colonnes de localisation disponibles:');
    console.log('='.repeat(40));
    
    const locationColumns = [
      'geom', 'center_point', 'soil_type', 'water_source', 
      'name_season_snapshot', 'area_hectares', 'status'
    ];
    
    locationColumns.forEach(col => {
      const hasColumn = samplePlot.hasOwnProperty(col);
      const value = samplePlot[col];
      console.log(`   ${col.padEnd(20)}: ${hasColumn ? '✅' : '❌'} = ${value || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkPlotsStructure();