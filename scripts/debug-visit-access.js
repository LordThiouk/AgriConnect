/**
 * Diagnostiquer l'accès aux visites
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

async function debugVisitAccess() {
  console.log('🔍 Diagnostic de l\'accès aux visites\n');
  console.log('═'.repeat(80));
  
  // Récupérer une visite
  const { data: visits } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, agent_id')
    .limit(1);
  
  if (!visits || visits.length === 0) {
    console.log('❌ Aucune visite trouvée');
    return;
  }
  
  const visit = visits[0];
  console.log(`\n📋 Visite: ${visit.id}`);
  console.log(`   Producer: ${visit.producer_id}`);
  console.log(`   Plot: ${visit.plot_id}`);
  console.log(`   Agent: ${visit.agent_id}`);
  
  // Vérifier les assignations pour ce producteur
  console.log(`\n🔍 Vérification des assignations pour le producteur ${visit.producer_id}:`);
  
  const { data: assignments } = await supabase
    .from('agent_assignments')
    .select('agent_id, assigned_to_id, assigned_to_type')
    .eq('assigned_to_id', visit.producer_id)
    .eq('assigned_to_type', 'producer');
  
  if (assignments && assignments.length > 0) {
    console.log(`   ✅ ${assignments.length} assignation(s) trouvée(s):`);
    assignments.forEach((assignment, index) => {
      console.log(`      ${index + 1}. Agent: ${assignment.agent_id}`);
    });
  } else {
    console.log(`   ❌ Aucune assignation trouvée pour ce producteur`);
  }
  
  // Vérifier le profil de l'agent de la visite
  console.log(`\n🔍 Vérification du profil de l'agent ${visit.agent_id}:`);
  
  const { data: agentProfile } = await supabase
    .from('profiles')
    .select('user_id, role, display_name')
    .eq('user_id', visit.agent_id);
  
  if (agentProfile && agentProfile.length > 0) {
    console.log(`   ✅ Profil agent trouvé:`);
    console.log(`      User ID: ${agentProfile[0].user_id}`);
    console.log(`      Rôle: ${agentProfile[0].role}`);
    console.log(`      Nom: ${agentProfile[0].display_name}`);
  } else {
    console.log(`   ❌ Profil agent non trouvé`);
  }
  
  // Vérifier si l'agent est assigné au producteur
  console.log(`\n🔍 Vérification si l'agent ${visit.agent_id} est assigné au producteur ${visit.producer_id}:`);
  
  const { data: agentAssignment } = await supabase
    .from('agent_assignments')
    .select('agent_id, assigned_to_id, assigned_to_type')
    .eq('agent_id', visit.agent_id)
    .eq('assigned_to_id', visit.producer_id)
    .eq('assigned_to_type', 'producer');
  
  if (agentAssignment && agentAssignment.length > 0) {
    console.log(`   ✅ L'agent est assigné au producteur`);
  } else {
    console.log(`   ❌ L'agent N'EST PAS assigné au producteur`);
  }
  
  // Tester avec l'agent de la visite
  console.log(`\n🧪 Test du RPC avec l'agent de la visite (${visit.agent_id}):`);
  
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_visit_for_edit', { p_visit_id: visit.id });
  
  if (rpcError) {
    console.log(`   ❌ Erreur RPC: ${rpcError.code} - ${rpcError.message}`);
  } else {
    console.log(`   ✅ RPC réussi !`);
    console.log(`   Producer: ${rpcData.producer?.first_name} ${rpcData.producer?.last_name}`);
    console.log(`   Plot: ${rpcData.plot?.name}`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Diagnostic terminé\n');
}

debugVisitAccess().catch(console.error);
