const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecommendationsStructure() {
  console.log('🔍 Vérification des recommandations/conseils dans la base de données...\n');

  try {
    // 1. Vérifier la structure de la table recommendations
    console.log('📋 Vérification de la table "recommendations":');
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`   ❌ Erreur lors de la récupération des recommandations:`, error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`   ✅ ${data.length} recommandations trouvées dans la base de données`);
      console.log('   📊 Structure des données:');
      
      data.forEach((rec, index) => {
        console.log(`     Recommendation ${index + 1}:`);
        Object.keys(rec).forEach(column => {
          console.log(`       - ${column}: ${typeof rec[column]} ${rec[column] !== null ? `= ${JSON.stringify(rec[column])}` : '(null)'}`);
        });
      });
    } else {
      console.log('   ⚠️ Aucune recommandation trouvée dans la base de données');
    }

    // 2. Vérifier spécifiquement les recommandations liées à la parcelle vue dans les logs
    const plotId = '556d16c2-e2d4-4df5-9ba8-2d3dbda56ba8';
    console.log(`\n🎯 Test spécifique pour la parcelle ${plotId}:`);
    
    const { data: plotRecs, error: plotError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('plot_id', plotId);

    if (plotError) {
      console.log(`   ❌ Erreur lors de la récupération pour cette parcelle:`, plotError.message);
    } else {
      console.log(`   📊 ${plotRecs?.length || 0} recommandations trouvées pour cette parcelle`);
      if (plotRecs && plotRecs.length > 0) {
        plotRecs.forEach((rec, index) => {
          console.log(`     ${index + 1}. Title: ${rec.title || 'N/A'}`);
          console.log(`        Message: ${rec.message || 'N/A'}`);
          console.log(`        Status: ${rec.status || 'N/A'}`);
          console.log(`        Date: ${rec.created_at || 'N/A'}`);
        });
      }
    }

    // 3. Vérifier les données basiques pour tester les filtres
    console.log('\n🔧 Test de filtrage RLS RPC - récupération avec conditions RLS:');
    
    const { data: allRecs, error: allError } = await supabase
      .from('recommendations')
      .select(`
        id,
        title,
        message,
        plot_id,
        status,
        recommendation_type,
        created_at
      `)
      .limit(5);

    if (allError) {
      console.log('   ❌ Erreur lors de la récupération générale:', allError.message);
    } else {
      console.log(`   ✅ ${allRecs?.length || 0} recommandations accessibles globalement`);
    }

  } catch (error) {
    console.error('❌ Erreur générale dans checkRecommendationsStructure:', error);
  }
}

checkRecommendationsStructure().catch(console.error);
