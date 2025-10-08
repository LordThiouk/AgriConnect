/**
 * Créer des visites de test pour aujourd'hui
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

async function createTestVisits() {
  console.log('🔍 Création de visites de test pour aujourd\'hui\n');
  console.log('═'.repeat(80));
  
  // 1. Récupérer un agent et des producteurs
  console.log('1️⃣ Récupération des données nécessaires:');
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, role')
    .eq('role', 'agent')
    .limit(1);
  
  if (agentsError || !agents || agents.length === 0) {
    console.error('❌ Aucun agent trouvé:', agentsError);
    return;
  }
  
  const agent = agents[0];
  console.log(`✅ Agent trouvé: ${agent.user_id}`);
  
  // Récupérer des producteurs
  const { data: producers, error: producersError } = await supabase
    .from('producers')
    .select('id, first_name, last_name')
    .limit(3);
  
  if (producersError || !producers || producers.length === 0) {
    console.error('❌ Aucun producteur trouvé:', producersError);
    return;
  }
  
  console.log(`✅ ${producers.length} producteurs trouvés`);
  
  // Récupérer des parcelles
  const { data: plots, error: plotsError } = await supabase
    .from('plots')
    .select('id, name_season_snapshot, producer_id')
    .limit(3);
  
  if (plotsError || !plots || plots.length === 0) {
    console.error('❌ Aucune parcelle trouvée:', plotsError);
    return;
  }
  
  console.log(`✅ ${plots.length} parcelles trouvées`);
  
  // 2. Créer des visites pour aujourd'hui
  console.log('\n2️⃣ Création des visites de test:');
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < Math.min(producers.length, plots.length); i++) {
    const producer = producers[i];
    const plot = plots[i];
    
    const visitData = {
      producer_id: producer.id,
      plot_id: plot.id,
      agent_id: agent.user_id,
      visit_date: today,
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 30,
      notes: `Visite de test ${i + 1}`,
      weather_conditions: 'sunny'
    };
    
    console.log(`   Création visite ${i + 1}: ${producer.first_name} - ${plot.name_season_snapshot}`);
    
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert(visitData)
      .select('id')
      .single();
    
    if (visitError) {
      console.error(`   ❌ Erreur création visite ${i + 1}:`, visitError.message);
    } else {
      console.log(`   ✅ Visite ${i + 1} créée: ${visit.id}`);
    }
  }
  
  // 3. Vérifier les visites créées
  console.log('\n3️⃣ Vérification des visites créées:');
  const { data: createdVisits, error: createdVisitsError } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, agent_id, visit_date, status')
    .eq('agent_id', agent.user_id)
    .eq('visit_date', today)
    .order('created_at', { ascending: false });
  
  if (createdVisitsError) {
    console.error('❌ Erreur vérification visites:', createdVisitsError);
  } else {
    console.log(`✅ ${createdVisits?.length || 0} visites créées pour aujourd'hui:`);
    createdVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id} - ${visit.status} - ${visit.visit_date}`);
    });
  }
  
  // 4. Tester le RPC get_agent_today_visits
  console.log('\n4️⃣ Test du RPC get_agent_today_visits:');
  const { data: rpcVisits, error: rpcError } = await supabase
    .rpc('get_agent_today_visits', { p_user_id: agent.user_id });
  
  if (rpcError) {
    console.error('❌ Erreur RPC:', rpcError);
  } else {
    console.log(`✅ RPC retourne ${rpcVisits?.length || 0} visites:`);
    rpcVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id} - ${visit.producer} - ${visit.status}`);
    });
  }
}

createTestVisits().catch(console.error);
