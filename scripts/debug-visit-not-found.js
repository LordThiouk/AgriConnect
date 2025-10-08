/**
 * Diagnostiquer pourquoi une visite n'est pas trouvée
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

async function debugVisitNotFound() {
  console.log('🔍 Diagnostic visite non trouvée\n');
  console.log('═'.repeat(80));
  
  const visitId = '6203b6b6-f530-4971-b62d-26f4c570058c';
  console.log(`\n📋 Visite ID: ${visitId}`);
  
  // 1. Vérifier si la visite existe dans la table visits
  console.log(`\n1️⃣ Vérification dans la table visits:`);
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('*')
    .eq('id', visitId)
    .single();
  
  if (visitError) {
    console.log(`   ❌ Erreur: ${visitError.code} - ${visitError.message}`);
  } else if (visit) {
    console.log(`   ✅ Visite trouvée dans la table visits:`);
    console.log(`      ID: ${visit.id}`);
    console.log(`      Producer: ${visit.producer_id}`);
    console.log(`      Plot: ${visit.plot_id}`);
    console.log(`      Agent: ${visit.agent_id}`);
    console.log(`      Date: ${visit.visit_date}`);
    console.log(`      Status: ${visit.status}`);
  } else {
    console.log(`   ❌ Visite non trouvée dans la table visits`);
  }
  
  // 2. Vérifier les producteurs liés
  if (visit) {
    console.log(`\n2️⃣ Vérification du producteur ${visit.producer_id}:`);
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('*')
      .eq('id', visit.producer_id)
      .single();
    
    if (producerError) {
      console.log(`   ❌ Erreur producteur: ${producerError.code} - ${producerError.message}`);
    } else if (producer) {
      console.log(`   ✅ Producteur trouvé: ${producer.first_name} ${producer.last_name}`);
    } else {
      console.log(`   ❌ Producteur non trouvé`);
    }
    
    // 3. Vérifier les parcelles liées
    console.log(`\n3️⃣ Vérification de la parcelle ${visit.plot_id}:`);
    const { data: plot, error: plotError } = await supabase
      .from('plots')
      .select('*')
      .eq('id', visit.plot_id)
      .single();
    
    if (plotError) {
      console.log(`   ❌ Erreur parcelle: ${plotError.code} - ${plotError.message}`);
    } else if (plot) {
      console.log(`   ✅ Parcelle trouvée: ${plot.name_season_snapshot}`);
    } else {
      console.log(`   ❌ Parcelle non trouvée`);
    }
  }
  
  // 4. Tester le RPC get_visit_for_edit
  console.log(`\n4️⃣ Test du RPC get_visit_for_edit:`);
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_visit_for_edit', { p_visit_id: visitId });
  
  if (rpcError) {
    console.log(`   ❌ Erreur RPC: ${rpcError.code} - ${rpcError.message}`);
    console.log(`   Détails: ${rpcError.details}`);
    console.log(`   Hint: ${rpcError.hint}`);
  } else if (rpcData) {
    console.log(`   ✅ RPC réussi !`);
    console.log(`   Producer: ${rpcData.producer?.first_name} ${rpcData.producer?.last_name}`);
    console.log(`   Plot: ${rpcData.plot?.name}`);
  } else {
    console.log(`   ❌ RPC retourne null`);
  }
  
  // 5. Lister toutes les visites pour comparaison
  console.log(`\n5️⃣ Liste des visites existantes:`);
  const { data: allVisits } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, agent_id, visit_date, status')
    .limit(5);
  
  if (allVisits && allVisits.length > 0) {
    console.log(`   ✅ ${allVisits.length} visite(s) trouvée(s):`);
    allVisits.forEach((v, index) => {
      console.log(`      ${index + 1}. ${v.id} (${v.status})`);
    });
  } else {
    console.log(`   ❌ Aucune visite trouvée`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Diagnostic terminé\n');
}

debugVisitNotFound().catch(console.error);
