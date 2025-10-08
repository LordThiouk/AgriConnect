/**
 * Vérifier la fonction get_plots_by_producer
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGetPlotsByProducer() {
  console.log('🔍 Vérification de la fonction get_plots_by_producer\n');
  console.log('═'.repeat(80));
  
  // 1. Récupérer un producteur existant
  console.log('1️⃣ Récupération d\'un producteur existant:');
  const { data: producers, error: producersError } = await supabase
    .from('producers')
    .select('id, first_name, last_name')
    .limit(1);
  
  if (producersError || !producers || producers.length === 0) {
    console.error('❌ Aucun producteur trouvé:', producersError);
    return;
  }
  
  const producer = producers[0];
  console.log(`✅ Producteur trouvé: ${producer.first_name} ${producer.last_name} (${producer.id})`);
  
  // 2. Tester la fonction avec p_producer_id
  console.log('\n2️⃣ Test avec p_producer_id:');
  const { data: plots1, error: error1 } = await supabase
    .rpc('get_plots_by_producer', { p_producer_id: producer.id });
  
  if (error1) {
    console.error('❌ Erreur avec p_producer_id:', error1);
  } else {
    console.log(`✅ Succès avec p_producer_id: ${plots1?.length || 0} parcelles`);
    if (plots1 && plots1.length > 0) {
      plots1.forEach((plot, index) => {
        console.log(`   ${index + 1}. ${plot.name} - ${plot.area_hectares} ha`);
      });
    }
  }
  
  // 3. Tester la fonction avec producer_id_param
  console.log('\n3️⃣ Test avec producer_id_param:');
  const { data: plots2, error: error2 } = await supabase
    .rpc('get_plots_by_producer', { producer_id_param: producer.id });
  
  if (error2) {
    console.error('❌ Erreur avec producer_id_param:', error2);
  } else {
    console.log(`✅ Succès avec producer_id_param: ${plots2?.length || 0} parcelles`);
    if (plots2 && plots2.length > 0) {
      plots2.forEach((plot, index) => {
        console.log(`   ${index + 1}. ${plot.name} - ${plot.area_hectares} ha`);
      });
    }
  }
  
  // 4. Vérifier les parcelles réelles
  console.log('\n4️⃣ Parcelles réelles dans la table plots:');
  const { data: realPlots, error: realPlotsError } = await supabase
    .from('plots')
    .select('id, name_season_snapshot, area_hectares, producer_id')
    .eq('producer_id', producer.id)
    .limit(5);
  
  if (realPlotsError) {
    console.error('❌ Erreur récupération parcelles réelles:', realPlotsError);
  } else {
    console.log(`✅ ${realPlots?.length || 0} parcelles réelles trouvées:`);
    realPlots?.forEach((plot, index) => {
      console.log(`   ${index + 1}. ${plot.name_season_snapshot} - ${plot.area_hectares} ha`);
    });
  }
}

checkGetPlotsByProducer().catch(console.error);
