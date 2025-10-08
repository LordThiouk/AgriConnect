/**
 * Vérifier les agents existants
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

async function checkExistingAgents() {
  console.log('🔍 Vérification des agents existants\n');
  console.log('═'.repeat(80));
  
  // 1. Vérifier les profils agents
  console.log('1️⃣ Profils agents dans la table profiles:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name, phone')
    .eq('role', 'agent');
  
  if (profilesError) {
    console.error('❌ Erreur récupération profils:', profilesError);
    return;
  }
  
  console.log(`✅ ${profiles?.length || 0} profils agents trouvés:`);
  profiles?.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.display_name || 'Sans nom'} (${profile.user_id})`);
    console.log(`      ID profil: ${profile.id}`);
    console.log(`      Téléphone: ${profile.phone || 'Non renseigné'}`);
    console.log('');
  });
  
  // 2. Vérifier les assignations d'agents
  console.log('2️⃣ Assignations d\'agents dans agent_assignments:');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agent_assignments')
    .select('agent_id, assigned_to_id, assigned_to_type')
    .limit(10);
  
  if (assignmentsError) {
    console.error('❌ Erreur récupération assignations:', assignmentsError);
  } else {
    console.log(`✅ ${assignments?.length || 0} assignations trouvées:`);
    assignments?.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Agent: ${assignment.agent_id} → ${assignment.assigned_to_type}: ${assignment.assigned_to_id}`);
    });
  }
  
  // 3. Vérifier les visites existantes
  console.log('\n3️⃣ Visites existantes:');
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, producer_id, plot_id, visit_date, status')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (visitsError) {
    console.error('❌ Erreur récupération visites:', visitsError);
  } else {
    console.log(`✅ ${visits?.length || 0} visites trouvées:`);
    visits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id} - Agent: ${visit.agent_id} - ${visit.status}`);
    });
  }
}

checkExistingAgents().catch(console.error);
