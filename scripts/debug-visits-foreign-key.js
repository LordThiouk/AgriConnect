require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVisitsForeignKey() {
  console.log('🔍 Debug de la contrainte de clé étrangère visits.agent_id\n');
  
  // 1. Vérifier la structure de la table visits
  console.log('📋 Structure de la table visits:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visitsStructure, error: visitsError } = await supabase
    .from('visits')
    .select('*')
    .limit(1);
  
  if (visitsError) {
    console.log(`❌ Erreur récupération structure visits: ${visitsError.message}`);
  } else {
    console.log('✅ Colonnes de la table visits:');
    if (visitsStructure && visitsStructure.length > 0) {
      Object.keys(visitsStructure[0]).forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}: ${typeof visitsStructure[0][key]}`);
      });
    }
  }
  
  // 2. Vérifier les contraintes de clé étrangère
  console.log('\n🔗 Contraintes de clé étrangère:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: constraints, error: constraintsError } = await supabase
    .rpc('get_foreign_keys', { table_name: 'visits' });
  
  if (constraintsError) {
    console.log(`❌ Erreur récupération contraintes: ${constraintsError.message}`);
    
    // Essayer une requête alternative
    const { data: constraintsAlt, error: constraintsAltError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'visits')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (constraintsAltError) {
      console.log(`❌ Erreur récupération contraintes alternative: ${constraintsAltError.message}`);
    } else {
      console.log(`✅ Contraintes trouvées: ${constraintsAlt?.length || 0}`);
      if (constraintsAlt && constraintsAlt.length > 0) {
        constraintsAlt.forEach((constraint, index) => {
          console.log(`   ${index + 1}. ${constraint.constraint_name}`);
        });
      }
    }
  } else {
    console.log(`✅ Contraintes trouvées: ${constraints?.length || 0}`);
    if (constraints && constraints.length > 0) {
      constraints.forEach((constraint, index) => {
        console.log(`   ${index + 1}. ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });
    }
  }
  
  // 3. Vérifier les valeurs agent_id dans visits
  console.log('\n👤 Valeurs agent_id dans visits:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agentIds, error: agentIdsError } = await supabase
    .from('visits')
    .select('agent_id')
    .not('agent_id', 'is', null)
    .limit(10);
  
  if (agentIdsError) {
    console.log(`❌ Erreur récupération agent_id: ${agentIdsError.message}`);
  } else {
    console.log(`✅ Agent IDs trouvés: ${agentIds?.length || 0}`);
    if (agentIds && agentIds.length > 0) {
      const uniqueAgentIds = [...new Set(agentIds.map(v => v.agent_id))];
      console.log('   IDs uniques:', uniqueAgentIds);
      
      // Vérifier si ces IDs existent dans la table users
      for (const agentId of uniqueAgentIds.slice(0, 3)) {
        console.log(`\n🔍 Vérification de l'agent ID: ${agentId}`);
        
        // Vérifier dans auth.users
        const { data: authUser, error: authError } = await supabase
          .from('auth.users')
          .select('id, email, phone')
          .eq('id', agentId)
          .single();
        
        if (authError) {
          console.log(`   ❌ Non trouvé dans auth.users: ${authError.message}`);
        } else {
          console.log(`   ✅ Trouvé dans auth.users: ${authUser.email || authUser.phone}`);
        }
        
        // Vérifier dans profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, role')
          .eq('user_id', agentId)
          .single();
        
        if (profileError) {
          console.log(`   ❌ Non trouvé dans profiles: ${profileError.message}`);
        } else {
          console.log(`   ✅ Trouvé dans profiles: ${profile.display_name} (${profile.role})`);
        }
      }
    }
  }
  
  // 4. Vérifier la table users (si elle existe)
  console.log('\n👥 Vérification de la table users:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, phone')
    .limit(5);
  
  if (usersError) {
    console.log(`❌ Erreur récupération users: ${usersError.message}`);
    console.log('   La table "users" n\'existe probablement pas');
  } else {
    console.log(`✅ Users trouvés: ${users?.length || 0}`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Phone: ${user.phone}`);
      });
    }
  }
  
  // 5. Vérifier auth.users
  console.log('\n🔐 Vérification de auth.users:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: authUsers, error: authUsersError } = await supabase
    .from('auth.users')
    .select('id, email, phone')
    .limit(5);
  
  if (authUsersError) {
    console.log(`❌ Erreur récupération auth.users: ${authUsersError.message}`);
  } else {
    console.log(`✅ Auth users trouvés: ${authUsers?.length || 0}`);
    if (authUsers && authUsers.length > 0) {
      authUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Phone: ${user.phone}`);
      });
    }
  }
  
  console.log('\n🎯 DIAGNOSTIC:');
  console.log('──────────────────────────────────────────────────');
  console.log('Le problème est que visits.agent_id fait référence à une table "users"');
  console.log('qui n\'existe pas ou ne contient pas les IDs référencés.');
  console.log('Il faut corriger la contrainte de clé étrangère pour pointer vers');
  console.log('la bonne table (probablement auth.users ou profiles).');
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugVisitsForeignKey();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
