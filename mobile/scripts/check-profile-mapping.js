/**
 * Script pour vérifier la correspondance entre user_id et id dans profiles
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

async function checkProfileMapping() {
  console.log('🔍 === VÉRIFICATION MAPPING PROFILES ===\n');
  
  try {
    // 1. Vérifier les agents dans profiles
    console.log('👤 Agents dans profiles:');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('role', 'agent')
      .limit(10);
    
    if (agentsError) {
      console.error('❌ Erreur agents:', agentsError);
    } else {
      console.log(`✅ ${agents?.length || 0} agents trouvés`);
      if (agents && agents.length > 0) {
        agents.forEach((agent, index) => {
          console.log(`   ${index + 1}. ID: ${agent.id}`);
          console.log(`      User ID: ${agent.user_id}`);
          console.log(`      Display Name: ${agent.display_name}`);
          console.log(`      Role: ${agent.role}`);
          console.log('');
        });
      }
    }
    
    // 2. Vérifier les assignations avec l'ID du profil
    console.log('📊 Test avec ID du profil (0f33842a-a1f1-4ad5-8113-39285e5013df):');
    const { data: profileAssignments, error: profileError } = await supabase
      .rpc('get_agent_assignments', {
        p_agent_id: '0f33842a-a1f1-4ad5-8113-39285e5013df'
      });
    
    if (profileError) {
      console.error('❌ Erreur avec ID profil:', profileError);
    } else {
      console.log(`✅ Assignations avec ID profil: ${profileAssignments?.length || 0}`);
      if (profileAssignments && profileAssignments.length > 0) {
        console.log('   Exemples:');
        profileAssignments.slice(0, 3).forEach((assignment, index) => {
          console.log(`   ${index + 1}. ${assignment.assigned_to_name} (${assignment.assigned_to_type})`);
        });
      }
    }
    
    // 3. Vérifier les assignations avec l'ID utilisateur
    console.log('\n📊 Test avec ID utilisateur (b00a283f-0a46-41d2-af95-8a256c9c2771):');
    const { data: userAssignments, error: userError } = await supabase
      .rpc('get_agent_assignments', {
        p_agent_id: 'b00a283f-0a46-41d2-af95-8a256c9c2771'
      });
    
    if (userError) {
      console.error('❌ Erreur avec ID utilisateur:', userError);
    } else {
      console.log(`✅ Assignations avec ID utilisateur: ${userAssignments?.length || 0}`);
    }
    
    // 4. Vérifier la correspondance directe
    console.log('\n🔍 Correspondance directe:');
    const { data: directMapping, error: mappingError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name')
      .in('id', ['0f33842a-a1f1-4ad5-8113-39285e5013df', 'b00a283f-0a46-41d2-af95-8a256c9c2771'])
      .or('user_id.in.(0f33842a-a1f1-4ad5-8113-39285e5013df,b00a283f-0a46-41d2-af95-8a256c9c2771)');
    
    if (mappingError) {
      console.error('❌ Erreur mapping:', mappingError);
    } else {
      console.log(`✅ Correspondances trouvées: ${directMapping?.length || 0}`);
      if (directMapping && directMapping.length > 0) {
        directMapping.forEach((profile, index) => {
          console.log(`   ${index + 1}. ID: ${profile.id}`);
          console.log(`      User ID: ${profile.user_id}`);
          console.log(`      Display Name: ${profile.display_name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkProfileMapping();
