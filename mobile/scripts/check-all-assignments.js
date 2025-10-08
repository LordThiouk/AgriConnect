/**
 * Script pour vérifier toutes les assignations dans la base
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllAssignments() {
  console.log('🧪 === VÉRIFICATION DE TOUTES LES ASSIGNATIONS ===\n');
  
  try {
    // 1. Récupérer toutes les assignations
    console.log('📊 Récupération de toutes les assignations...');
    const { data: allAssignments, error: allError } = await supabase
      .from('agent_assignments')
      .select('*')
      .limit(10);
    
    if (allError) {
      console.error('❌ Erreur toutes assignations:', allError);
    } else {
      console.log('✅ Total assignations trouvées:', allAssignments?.length || 0);
      console.log('📋 Détails:', allAssignments?.slice(0, 5));
    }
    
    // 2. Récupérer tous les agents
    console.log('\n📊 Récupération de tous les agents...');
    const { data: allAgents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('role', 'agent')
      .limit(10);
    
    if (agentsError) {
      console.error('❌ Erreur agents:', agentsError);
    } else {
      console.log('✅ Total agents trouvés:', allAgents?.length || 0);
      console.log('📋 Détails agents:', allAgents?.slice(0, 5));
    }
    
    // 3. Vérifier si notre agent a des assignations avec d'autres IDs
    console.log('\n📊 Vérification des assignations pour notre agent...');
    const testAgentId = '0f33842a-a1f1-4ad5-8113-39285e5013df';
    
    // Chercher par assigned_by au lieu de agent_id
    const { data: assignedByAssignments, error: assignedByError } = await supabase
      .from('agent_assignments')
      .select('*')
      .eq('assigned_by', testAgentId);
    
    if (assignedByError) {
      console.error('❌ Erreur assigned_by:', assignedByError);
    } else {
      console.log('✅ Assignations assigned_by:', assignedByAssignments?.length || 0);
      console.log('📋 Détails assigned_by:', assignedByAssignments?.slice(0, 3));
    }
    
    // 4. Vérifier la structure de la table
    console.log('\n📊 Structure de la table agent_assignments...');
    if (allAssignments && allAssignments.length > 0) {
      const firstAssignment = allAssignments[0];
      console.log('📋 Colonnes disponibles:', Object.keys(firstAssignment));
      console.log('📋 Exemple d\'assignation:', firstAssignment);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkAllAssignments();
