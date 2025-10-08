/**
 * Diagnostiquer pourquoi aucune visite n'est visible pour aujourd'hui
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

async function debugVisitsToday() {
  console.log('🔍 Diagnostic des visites pour aujourd\'hui\n');
  console.log('═'.repeat(80));
  
  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Date d'aujourd'hui: ${today}`);
  
  // 1. Vérifier toutes les visites pour aujourd'hui
  console.log('\n1️⃣ Toutes les visites pour aujourd\'hui:');
  const { data: allVisits, error: allVisitsError } = await supabase
    .from('visits')
    .select(`
      id, 
      producer_id, 
      plot_id, 
      agent_id, 
      visit_date, 
      status,
      created_at,
      producers!inner(first_name, last_name),
      plots!inner(name_season_snapshot)
    `)
    .eq('visit_date', today)
    .order('created_at', { ascending: false });
  
  if (allVisitsError) {
    console.error('❌ Erreur récupération visites:', allVisitsError);
  } else {
    console.log(`✅ ${allVisits?.length || 0} visites trouvées pour aujourd'hui:`);
    allVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id}`);
      console.log(`      Agent: ${visit.agent_id}`);
      console.log(`      Producteur: ${visit.producers.first_name} ${visit.producers.last_name}`);
      console.log(`      Parcelle: ${visit.plots.name_season_snapshot}`);
      console.log(`      Statut: ${visit.status}`);
      console.log(`      Date: ${visit.visit_date}`);
      console.log(`      Créé: ${visit.created_at}`);
      console.log('');
    });
  }
  
  // 2. Vérifier les agents existants
  console.log('2️⃣ Agents existants:');
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name')
    .eq('role', 'agent');
  
  if (agentsError) {
    console.error('❌ Erreur récupération agents:', agentsError);
  } else {
    console.log(`✅ ${agents?.length || 0} agents trouvés:`);
    agents?.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.display_name || 'Sans nom'} (${agent.user_id})`);
      console.log(`      ID profil: ${agent.id}`);
    });
  }
  
  // 3. Tester le RPC get_agent_today_visits pour chaque agent
  console.log('\n3️⃣ Test du RPC get_agent_today_visits pour chaque agent:');
  if (agents && agents.length > 0) {
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      console.log(`\n   Test agent ${i + 1}: ${agent.display_name || 'Sans nom'} (${agent.user_id})`);
      
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
  
  // 4. Vérifier les visites par agent_id (pas user_id)
  console.log('\n4️⃣ Visites par agent_id (ID de profil):');
  if (agents && agents.length > 0) {
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      console.log(`\n   Agent ${i + 1}: ${agent.display_name || 'Sans nom'}`);
      console.log(`   ID profil: ${agent.id}`);
      console.log(`   User ID: ${agent.user_id}`);
      
      const { data: visitsByProfileId, error: visitsError } = await supabase
        .from('visits')
        .select(`
          id, 
          producer_id, 
          plot_id, 
          agent_id, 
          visit_date, 
          status,
          producers!inner(first_name, last_name),
          plots!inner(name_season_snapshot)
        `)
        .eq('agent_id', agent.user_id)
        .eq('visit_date', today);
      
      if (visitsError) {
        console.error(`   ❌ Erreur récupération visites:`, visitsError.message);
      } else {
        console.log(`   ✅ ${visitsByProfileId?.length || 0} visites trouvées:`);
        visitsByProfileId?.forEach((visit, index) => {
          console.log(`      ${index + 1}. ${visit.id} - ${visit.producers.first_name} - ${visit.plots.name_season_snapshot}`);
        });
      }
    }
  }
  
  // 5. Vérifier la structure de la table visits
  console.log('\n5️⃣ Structure de la table visits:');
  const { data: visitSample, error: visitSampleError } = await supabase
    .from('visits')
    .select('*')
    .limit(1);
  
  if (visitSampleError) {
    console.error('❌ Erreur récupération échantillon:', visitSampleError);
  } else if (visitSample && visitSample.length > 0) {
    console.log('✅ Structure de la table visits:');
    console.log(JSON.stringify(visitSample[0], null, 2));
  } else {
    console.log('⚠️ Aucune visite dans la table visits');
  }
}

debugVisitsToday().catch(console.error);
