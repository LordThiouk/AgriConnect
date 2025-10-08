/**
 * Analyser la partie visites du dashboard agent
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

async function analyzeAgentDashboardVisits() {
  console.log('🔍 Analyse de la partie visites du dashboard agent\n');
  console.log('═'.repeat(80));
  
  // 1. Récupérer un agent existant
  console.log('1️⃣ Récupération d\'un agent existant:');
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name')
    .eq('role', 'agent')
    .limit(1);
  
  if (agentsError || !agents || agents.length === 0) {
    console.error('❌ Aucun agent trouvé:', agentsError);
    return;
  }
  
  const agent = agents[0];
  console.log(`✅ Agent trouvé: ${agent.display_name} (${agent.user_id})`);
  
  // 2. Tester le RPC get_agent_today_visits
  console.log('\n2️⃣ Test du RPC get_agent_today_visits:');
  const { data: visits, error: visitsError } = await supabase
    .rpc('get_agent_today_visits', { p_user_id: agent.user_id });
  
  if (visitsError) {
    console.error('❌ Erreur RPC get_agent_today_visits:', visitsError);
    return;
  }
  
  console.log(`✅ RPC retourne ${visits?.length || 0} visites:`);
  if (visits && visits.length > 0) {
    visits.forEach((visit, index) => {
      console.log(`   ${index + 1}. ID: ${visit.id}`);
      console.log(`      Producteur: ${visit.producer}`);
      console.log(`      Location: ${visit.location}`);
      console.log(`      Status: ${visit.status}`);
      console.log(`      Visit Date: ${visit.visit_date}`);
      console.log(`      Duration: ${visit.duration_minutes} min`);
      console.log(`      Has GPS: ${visit.hasGps}`);
      console.log(`      Plot ID: ${visit.plotId}`);
      console.log('');
    });
  } else {
    console.log('   Aucune visite trouvée');
  }
  
  // 3. Vérifier les assignations de l'agent
  console.log('3️⃣ Vérification des assignations de l\'agent:');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agent_assignments')
    .select('assigned_to_id, assigned_to_type')
    .eq('assigned_by_id', agent.id);
  
  if (assignmentsError) {
    console.error('❌ Erreur récupération assignations:', assignmentsError);
  } else {
    console.log(`✅ ${assignments?.length || 0} assignations trouvées:`);
    assignments?.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Type: ${assignment.assigned_to_type}, ID: ${assignment.assigned_to_id}`);
    });
  }
  
  // 4. Vérifier les visites réelles dans la table visits
  console.log('\n4️⃣ Vérification des visites réelles dans la table visits:');
  const { data: realVisits, error: realVisitsError } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, agent_id, visit_date, status, created_at')
    .eq('agent_id', agent.user_id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (realVisitsError) {
    console.error('❌ Erreur récupération visites réelles:', realVisitsError);
  } else {
    console.log(`✅ ${realVisits?.length || 0} visites réelles trouvées:`);
    realVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ID: ${visit.id}`);
      console.log(`      Producteur: ${visit.producer_id}`);
      console.log(`      Parcelle: ${visit.plot_id}`);
      console.log(`      Agent: ${visit.agent_id}`);
      console.log(`      Date: ${visit.visit_date}`);
      console.log(`      Statut: ${visit.status}`);
      console.log('');
    });
  }
  
  // 5. Analyser la structure des données retournées par le RPC
  console.log('5️⃣ Analyse de la structure des données RPC:');
  if (visits && visits.length > 0) {
    const sampleVisit = visits[0];
    console.log('Structure d\'une visite retournée par le RPC:');
    console.log(JSON.stringify(sampleVisit, null, 2));
    
    // Vérifier les champs attendus par l'interface TodayVisit
    const expectedFields = ['id', 'producer', 'location', 'status', 'hasGps', 'plotId', 'visit_date', 'duration_minutes'];
    console.log('\nChamps attendus vs présents:');
    expectedFields.forEach(field => {
      const present = sampleVisit.hasOwnProperty(field);
      console.log(`   ${present ? '✅' : '❌'} ${field}: ${present ? 'présent' : 'manquant'}`);
    });
  }
  
  // 6. Vérifier la correspondance entre les visites RPC et les visites réelles
  console.log('\n6️⃣ Correspondance entre RPC et visites réelles:');
  if (visits && realVisits) {
    const rpcIds = visits.map(v => v.id);
    const realIds = realVisits.map(v => v.id);
    
    console.log(`IDs RPC: ${rpcIds.join(', ')}`);
    console.log(`IDs réels: ${realIds.join(', ')}`);
    
    const matchingIds = rpcIds.filter(id => realIds.includes(id));
    console.log(`Correspondances: ${matchingIds.length}/${rpcIds.length}`);
    
    if (matchingIds.length === 0) {
      console.log('⚠️ Aucune correspondance entre les IDs RPC et les visites réelles');
    }
  }
}

analyzeAgentDashboardVisits().catch(console.error);
