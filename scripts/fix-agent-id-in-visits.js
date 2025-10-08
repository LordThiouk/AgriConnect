/**
 * Corriger les agent_id dans la table visits pour correspondre aux user_id
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

async function fixAgentIdInVisits() {
  console.log('🔍 Correction des agent_id dans la table visits\n');
  console.log('═'.repeat(80));
  
  // 1. Récupérer les agents avec leurs user_id et id
  console.log('1️⃣ Récupération des agents:');
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name')
    .eq('role', 'agent');
  
  if (agentsError || !agents || agents.length === 0) {
    console.error('❌ Aucun agent trouvé:', agentsError);
    return;
  }
  
  console.log(`✅ ${agents.length} agents trouvés:`);
  agents.forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.display_name || 'Sans nom'}`);
    console.log(`      ID profil: ${agent.id}`);
    console.log(`      User ID: ${agent.user_id}`);
    console.log('');
  });
  
  // 2. Récupérer les visites avec des agent_id incorrects
  console.log('2️⃣ Visites avec agent_id incorrects:');
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, producer_id, visit_date, status')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (visitsError) {
    console.error('❌ Erreur récupération visites:', visitsError);
    return;
  }
  
  console.log(`✅ ${visits.length} visites trouvées:`);
  visits.forEach((visit, index) => {
    const agent = agents.find(a => a.id === visit.agent_id);
    console.log(`   ${index + 1}. ${visit.id}`);
    console.log(`      Agent ID dans visite: ${visit.agent_id}`);
    console.log(`      Agent correspondant: ${agent?.display_name || 'Aucun'} (${agent?.user_id || 'N/A'})`);
    console.log(`      Date: ${visit.visit_date}`);
    console.log('');
  });
  
  // 3. Corriger les agent_id pour qu'ils correspondent aux user_id
  console.log('3️⃣ Correction des agent_id:');
  for (const agent of agents) {
    console.log(`\n   Correction pour ${agent.display_name || 'Sans nom'}:`);
    console.log(`   ID profil: ${agent.id} → User ID: ${agent.user_id}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('visits')
      .update({ agent_id: agent.user_id })
      .eq('agent_id', agent.id)
      .select('id');
    
    if (updateError) {
      console.error(`   ❌ Erreur mise à jour:`, updateError.message);
    } else {
      console.log(`   ✅ ${updateResult?.length || 0} visites mises à jour`);
      if (updateResult && updateResult.length > 0) {
        updateResult.forEach(visit => {
          console.log(`      - ${visit.id}`);
        });
      }
    }
  }
  
  // 4. Vérifier les corrections
  console.log('\n4️⃣ Vérification des corrections:');
  const { data: correctedVisits, error: correctedError } = await supabase
    .from('visits')
    .select(`
      id, 
      agent_id, 
      producer_id, 
      visit_date, 
      status,
      producers!inner(first_name, last_name),
      plots!inner(name_season_snapshot)
    `)
    .eq('visit_date', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false });
  
  if (correctedError) {
    console.error('❌ Erreur vérification:', correctedError);
  } else {
    console.log(`✅ ${correctedVisits?.length || 0} visites corrigées pour aujourd'hui:`);
    correctedVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id}`);
      console.log(`      Agent ID: ${visit.agent_id}`);
      console.log(`      Producteur: ${visit.producers.first_name} ${visit.producers.last_name}`);
      console.log(`      Parcelle: ${visit.plots.name_season_snapshot}`);
      console.log('');
    });
  }
  
  // 5. Tester le RPC pour chaque agent
  console.log('5️⃣ Test du RPC get_agent_today_visits après correction:');
  for (const agent of agents) {
    console.log(`\n   Test agent: ${agent.display_name || 'Sans nom'} (${agent.user_id})`);
    
    const { data: rpcVisits, error: rpcError } = await supabase
      .rpc('get_agent_today_visits', { p_user_id: agent.user_id });
    
    if (rpcError) {
      console.error(`   ❌ Erreur RPC:`, rpcError.message);
    } else {
      console.log(`   ✅ RPC retourne ${rpcVisits?.length || 0} visites:`);
      rpcVisits?.forEach((visit, index) => {
        console.log(`      ${index + 1}. ${visit.id} - ${visit.producer} - ${visit.location}`);
      });
    }
  }
}

fixAgentIdInVisits().catch(console.error);
