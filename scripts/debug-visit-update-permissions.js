require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
const PROBLEMATIC_VISIT_ID = '7a151bd7-f5c5-4b6a-8daa-f6339d5f8657';

async function debugVisitUpdatePermissions() {
  console.log('🔍 Debug des permissions de mise à jour des visites\n');
  
  // 1. Vérifier si la visite existe
  console.log('📋 Vérification de la visite problématique:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('*')
    .eq('id', PROBLEMATIC_VISIT_ID)
    .single();
  
  if (visitError) {
    console.log(`❌ Erreur récupération visite: ${visitError.message}`);
    console.log(`   Code: ${visitError.code}`);
    console.log(`   Détails: ${visitError.details}`);
  } else {
    console.log('✅ Visite trouvée:');
    console.log(`   ID: ${visit.id}`);
    console.log(`   Agent: ${visit.agent_id}`);
    console.log(`   Statut: ${visit.status}`);
    console.log(`   Date: ${visit.visit_date}`);
    console.log(`   Créée: ${visit.created_at}`);
    console.log(`   Modifiée: ${visit.updated_at}`);
  }
  
  // 2. Vérifier les permissions RLS
  console.log('\n🔐 Vérification des permissions RLS:');
  console.log('──────────────────────────────────────────────────');
  
  // Test de lecture
  const { data: readTest, error: readError } = await supabase
    .from('visits')
    .select('id, agent_id, status')
    .eq('id', PROBLEMATIC_VISIT_ID);
  
  if (readError) {
    console.log(`❌ Erreur lecture: ${readError.message}`);
  } else {
    console.log(`✅ Lecture OK: ${readTest?.length || 0} ligne(s)`);
  }
  
  // Test de mise à jour
  console.log('\n🔄 Test de mise à jour:');
  const { data: updateTest, error: updateError } = await supabase
    .from('visits')
    .update({ 
      updated_at: new Date().toISOString(),
      notes: 'Test de mise à jour - ' + new Date().toISOString()
    })
    .eq('id', PROBLEMATIC_VISIT_ID)
    .select();
  
  if (updateError) {
    console.log(`❌ Erreur mise à jour: ${updateError.message}`);
    console.log(`   Code: ${updateError.code}`);
    console.log(`   Détails: ${updateError.details}`);
    console.log(`   Hint: ${updateError.hint}`);
  } else {
    console.log(`✅ Mise à jour OK: ${updateTest?.length || 0} ligne(s) modifiée(s)`);
    if (updateTest && updateTest.length > 0) {
      console.log('   Données mises à jour:', updateTest[0]);
    }
  }
  
  // 3. Vérifier les politiques RLS
  console.log('\n📜 Vérification des politiques RLS:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_table_policies', { table_name: 'visits' });
  
  if (policiesError) {
    console.log(`❌ Erreur récupération politiques: ${policiesError.message}`);
  } else {
    console.log(`✅ Politiques trouvées: ${policies?.length || 0}`);
    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname}: ${policy.cmd}`);
        console.log(`      Expression: ${policy.qual}`);
      });
    }
  }
  
  // 4. Vérifier l'agent et ses permissions
  console.log('\n👤 Vérification de l\'agent:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agent, error: agentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', TEST_AGENT_ID)
    .single();
  
  if (agentError) {
    console.log(`❌ Erreur récupération agent: ${agentError.message}`);
  } else {
    console.log('✅ Agent trouvé:');
    console.log(`   ID: ${agent.id}`);
    console.log(`   Rôle: ${agent.role}`);
    console.log(`   Nom: ${agent.full_name}`);
    console.log(`   Téléphone: ${agent.phone}`);
  }
  
  // 5. Vérifier les assignments de l'agent
  console.log('\n📋 Vérification des assignments:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agent_assignments')
    .select('*')
    .eq('agent_id', TEST_AGENT_ID);
  
  if (assignmentsError) {
    console.log(`❌ Erreur récupération assignments: ${assignmentsError.message}`);
  } else {
    console.log(`✅ Assignments trouvés: ${assignments?.length || 0}`);
    if (assignments && assignments.length > 0) {
      assignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Producer: ${assignment.producer_id}, Créé: ${assignment.created_at}`);
      });
    }
  }
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugVisitUpdatePermissions();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
