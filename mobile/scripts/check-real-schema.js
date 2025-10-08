/**
 * Script pour vérifier le vrai schéma de la base de données
 */

require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRealSchema() {
  console.log('🔍 === VÉRIFICATION DU VRAI SCHÉMA ===\n');
  
  try {
    // 1. Vérifier la table profiles avec toutes les colonnes
    console.log('📋 Table profiles (toutes les colonnes):');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Colonnes disponibles:');
      Object.keys(profiles[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof profiles[0][col]}`);
      });
    } else {
      console.log('❌ Aucun profil trouvé');
    }
    
    // 2. Vérifier la table plots
    console.log('\n🏞️ Table plots (toutes les colonnes):');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .limit(1);
    
    if (plotsError) {
      console.error('❌ Erreur plots:', plotsError);
    } else if (plots && plots.length > 0) {
      console.log('✅ Colonnes disponibles:');
      Object.keys(plots[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof plots[0][col]}`);
      });
    } else {
      console.log('❌ Aucune parcelle trouvée');
    }
    
    // 3. Vérifier la table agent_assignments
    console.log('\n👥 Table agent_assignments (toutes les colonnes):');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('*')
      .limit(1);
    
    if (assignmentsError) {
      console.error('❌ Erreur agent_assignments:', assignmentsError);
    } else if (assignments && assignments.length > 0) {
      console.log('✅ Colonnes disponibles:');
      Object.keys(assignments[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof assignments[0][col]}`);
      });
    } else {
      console.log('❌ Aucune assignation trouvée');
    }
    
    // 4. Vérifier les RPC qui fonctionnent
    console.log('\n🔧 === TEST DES RPC QUI FONCTIONNENT ===');
    
    // Test get_agent_assignments
    console.log('📊 Test get_agent_assignments:');
    const { data: testAssignments, error: testError } = await supabase
      .rpc('get_agent_assignments', {
        p_agent_id: '0f33842a-a1f1-4ad5-8113-39285e5013df'
      });
    
    if (testError) {
      console.error('❌ Erreur get_agent_assignments:', testError);
    } else {
      console.log(`✅ get_agent_assignments fonctionne: ${testAssignments?.length || 0} résultats`);
      if (testAssignments && testAssignments.length > 0) {
        console.log('   Colonnes retournées:');
        Object.keys(testAssignments[0]).forEach(col => {
          console.log(`   - ${col}: ${typeof testAssignments[0][col]}`);
        });
      }
    }
    
    // 5. Vérifier les agents dans profiles
    console.log('\n👤 Agents dans profiles:');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .limit(5);
    
    if (agentsError) {
      console.error('❌ Erreur agents:', agentsError);
    } else {
      console.log(`✅ ${agents?.length || 0} agents trouvés`);
      if (agents && agents.length > 0) {
        agents.forEach((agent, index) => {
          console.log(`   ${index + 1}. ID: ${agent.id}`);
          console.log(`      Colonnes: ${Object.keys(agent).join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkRealSchema();
