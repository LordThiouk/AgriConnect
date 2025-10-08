/**
 * Vérifier les données dans agent_assignments
 * Comparer avec les visites existantes
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

async function checkAgentAssignments() {
  console.log('🔍 Vérification des données agent_assignments\n');
  console.log('═'.repeat(80));
  
  // 1. Compter les lignes dans agent_assignments
  console.log('\n📊 Table agent_assignments:');
  const { count, error: countError } = await supabase
    .from('agent_assignments')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Erreur:', countError);
    return;
  }
  
  console.log(`   Total lignes: ${count}`);
  
  // 2. Afficher quelques exemples
  const { data: assignments, error: assignError } = await supabase
    .from('agent_assignments')
    .select('*')
    .limit(10);
  
  if (assignments && assignments.length > 0) {
    console.log(`\n   Exemples (${Math.min(5, assignments.length)} premières lignes):\n`);
    assignments.slice(0, 5).forEach((a, idx) => {
      console.log(`   ${idx + 1}. agent_id: ${a.agent_id.slice(0, 8)}...`);
      console.log(`      assigned_to_type: ${a.assigned_to_type}`);
      console.log(`      assigned_to_id: ${a.assigned_to_id.slice(0, 8)}...`);
    });
  } else {
    console.log('\n   ⚠️  TABLE VIDE !');
  }
  
  // 3. Vérifier les visites existantes
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Visites existantes:\n');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, producer_id, plot_id')
    .limit(10);
  
  if (!visitsError && visits) {
    console.log(`   Total visites (sample): ${visits.length}`);
    
    // Compter les couples uniques agent_id + producer_id
    const uniquePairs = new Set();
    visits.forEach(v => {
      uniquePairs.add(`${v.agent_id}|${v.producer_id}`);
    });
    
    console.log(`   Couples uniques (agent_id, producer_id): ${uniquePairs.size}\n`);
    
    // 4. Comparer avec agent_assignments
    console.log('═'.repeat(80));
    console.log('\n🔍 Comparaison visits ↔ agent_assignments:\n');
    
    for (const pair of Array.from(uniquePairs).slice(0, 5)) {
      const [agentId, producerId] = pair.split('|');
      
      const { data: assignmentCheck } = await supabase
        .from('agent_assignments')
        .select('id')
        .eq('agent_id', agentId)
        .eq('assigned_to_id', producerId)
        .eq('assigned_to_type', 'producer')
        .maybeSingle();
      
      console.log(`   Agent ${agentId.slice(0, 8)}... → Producer ${producerId.slice(0, 8)}...`);
      console.log(`      Dans agent_assignments: ${assignmentCheck ? '✅ OUI' : '❌ NON'}\n`);
    }
  }
  
  // 5. Trouver les agents sans assignations
  console.log('═'.repeat(80));
  console.log('\n📋 Agents sans assignations:\n');
  
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, phone, display_name')
    .eq('role', 'agent');
  
  if (agents) {
    for (const agent of agents.slice(0, 5)) {
      const { count: assignCount } = await supabase
        .from('agent_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);
      
      console.log(`   ${agent.display_name || agent.phone}`);
      console.log(`      ID: ${agent.id}`);
      console.log(`      Assignations: ${assignCount || 0}`);
      
      if (assignCount === 0) {
        // Vérifier s'il a des visites
        const { count: visitCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id);
        
        console.log(`      Visites: ${visitCount || 0}`);
        
        if (visitCount && visitCount > 0) {
          console.log(`      ⚠️  PROBLÈME: ${visitCount} visites MAIS 0 assignations !`);
        }
      }
      console.log('');
    }
  }
  
  console.log('═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

checkAgentAssignments().catch(console.error);

