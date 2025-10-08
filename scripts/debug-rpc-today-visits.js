/**
 * Vérifier ce que retourne exactement le RPC get_agent_today_visits
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

async function debugRpcTodayVisits() {
  console.log('🔍 Vérification du RPC get_agent_today_visits\n');
  console.log('═'.repeat(80));
  
  // 1. Récupérer un agent existant
  console.log('1️⃣ Récupération d\'un agent existant:');
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name')
    .eq('role', 'agent')
    .limit(1);
  
  if (agentsError) {
    console.error('❌ Erreur agents:', agentsError.message);
    return;
  }
  
  if (!agents || agents.length === 0) {
    console.log('⚠️ Aucun agent trouvé');
    return;
  }
  
  const agent = agents[0];
  console.log('✅ Agent trouvé:', {
    id: agent.id,
    user_id: agent.user_id,
    display_name: agent.display_name
  });
  
  // 2. Tester le RPC avec l'agent
  console.log('\n2️⃣ Test du RPC get_agent_today_visits:');
  const { data: visits, error: visitsError } = await supabase
    .rpc('get_agent_today_visits', {
      p_user_id: agent.user_id
    });
  
  if (visitsError) {
    console.error('❌ Erreur RPC:', visitsError.message);
    console.error('   Code:', visitsError.code);
    console.error('   Détails:', visitsError.details);
    return;
  }
  
  console.log('✅ RPC réussi, nombre de visites:', visits?.length || 0);
  
  if (visits && visits.length > 0) {
    console.log('\n📋 Structure des données retournées:');
    console.log('Première visite:', JSON.stringify(visits[0], null, 2));
    
    console.log('\n🔍 Champs disponibles:');
    const firstVisit = visits[0];
    Object.keys(firstVisit).forEach(key => {
      console.log(`   - ${key}: ${typeof firstVisit[key]} = ${firstVisit[key]}`);
    });
  } else {
    console.log('⚠️ Aucune visite trouvée');
  }
  
  // 3. Vérifier les vraies visites dans la table
  console.log('\n3️⃣ Vérification des vraies visites dans la table:');
  const { data: realVisits, error: realVisitsError } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, visit_date, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (realVisitsError) {
    console.error('❌ Erreur vraies visites:', realVisitsError.message);
  } else {
    console.log('📋 Vraies visites dans la table:');
    realVisits.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id} - ${visit.visit_date} - ${visit.status}`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Diagnostic terminé');
}

debugRpcTodayVisits().catch(console.error);
