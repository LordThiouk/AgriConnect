require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeVisitsAgentIdUsage() {
  console.log('🔍 Analyse de l\'utilisation des agent_id dans les visites\n');
  
  // 1. Récupérer tous les profils agents
  console.log('👤 Profils agents disponibles:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, role, phone')
    .eq('role', 'agent')
    .order('created_at', { ascending: false });
  
  if (agentsError) {
    console.log(`❌ Erreur récupération agents: ${agentsError.message}`);
    return;
  }
  
  console.log(`✅ Agents trouvés: ${agents?.length || 0}`);
  if (agents && agents.length > 0) {
    agents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ID: ${agent.id}`);
      console.log(`      User ID: ${agent.user_id}`);
      console.log(`      Nom: ${agent.display_name || 'N/A'}`);
      console.log(`      Téléphone: ${agent.phone || 'N/A'}`);
      console.log('');
    });
  }
  
  // 2. Récupérer toutes les visites et analyser leurs agent_id
  console.log('📅 Analyse des agent_id dans les visites:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, visit_date, status, created_at')
    .order('created_at', { ascending: false });
  
  if (visitsError) {
    console.log(`❌ Erreur récupération visites: ${visitsError.message}`);
    return;
  }
  
  console.log(`✅ Visites trouvées: ${visits?.length || 0}`);
  
  if (visits && visits.length > 0) {
    // Analyser les correspondances
    const agentIds = [...new Set(visits.map(v => v.agent_id))];
    console.log(`\n🔍 Agent IDs uniques dans les visites: ${agentIds.length}`);
    
    agentIds.forEach((agentId, index) => {
      console.log(`   ${index + 1}. ${agentId}`);
      
      // Vérifier si c'est un profiles.id
      const matchingById = agents?.find(a => a.id === agentId);
      if (matchingById) {
        console.log(`      ✅ Correspondance par ID: ${matchingById.display_name}`);
      }
      
      // Vérifier si c'est un profiles.user_id
      const matchingByUserId = agents?.find(a => a.user_id === agentId);
      if (matchingByUserId) {
        console.log(`      ✅ Correspondance par User ID: ${matchingByUserId.display_name}`);
      }
      
      if (!matchingById && !matchingByUserId) {
        console.log(`      ❌ Aucune correspondance trouvée`);
      }
      console.log('');
    });
    
    // Statistiques
    const byIdMatches = agentIds.filter(agentId => 
      agents?.some(a => a.id === agentId)
    ).length;
    
    const byUserIdMatches = agentIds.filter(agentId => 
      agents?.some(a => a.user_id === agentId)
    ).length;
    
    const noMatches = agentIds.length - byIdMatches - byUserIdMatches;
    
    console.log('📊 Statistiques des correspondances:');
    console.log(`   ✅ Correspondances par profiles.id: ${byIdMatches}`);
    console.log(`   ✅ Correspondances par profiles.user_id: ${byUserIdMatches}`);
    console.log(`   ❌ Aucune correspondance: ${noMatches}`);
    
    // 3. Analyser les visites récentes pour voir le pattern
    console.log('\n📅 Visites récentes (dernières 5):');
    console.log('──────────────────────────────────────────────────');
    
    visits.slice(0, 5).forEach((visit, index) => {
      console.log(`   ${index + 1}. Visite: ${visit.id}`);
      console.log(`      Agent ID: ${visit.agent_id}`);
      console.log(`      Date: ${visit.visit_date}`);
      console.log(`      Statut: ${visit.status}`);
      console.log(`      Créée: ${visit.created_at}`);
      
      // Vérifier les correspondances
      const byIdMatch = agents?.find(a => a.id === visit.agent_id);
      const byUserIdMatch = agents?.find(a => a.user_id === visit.agent_id);
      
      if (byIdMatch) {
        console.log(`      ✅ Correspondance par ID: ${byIdMatch.display_name}`);
      } else if (byUserIdMatch) {
        console.log(`      ✅ Correspondance par User ID: ${byUserIdMatch.display_name}`);
      } else {
        console.log(`      ❌ Aucune correspondance`);
      }
      console.log('');
    });
    
    // 4. Recommandation basée sur l'analyse
    console.log('🎯 RECOMMANDATION:');
    console.log('──────────────────────────────────────────────────');
    
    if (byUserIdMatches > byIdMatches) {
      console.log('✅ Les visites utilisent principalement profiles.user_id');
      console.log('🔧 RECOMMANDATION: Garder la contrainte FK vers profiles.user_id');
      console.log('📱 L\'app mobile doit utiliser profiles.user_id pour agent_id');
    } else if (byIdMatches > byUserIdMatches) {
      console.log('✅ Les visites utilisent principalement profiles.id');
      console.log('🔧 RECOMMANDATION: Changer la contrainte FK vers profiles.id');
      console.log('📱 L\'app mobile utilise déjà profiles.id pour agent_id');
    } else {
      console.log('⚠️ Mélange d\'utilisations - analyse plus approfondie nécessaire');
      console.log('🔧 RECOMMANDATION: Standardiser sur une seule approche');
    }
  }
}

// Exécuter l'analyse
async function runAnalysis() {
  try {
    await analyzeVisitsAgentIdUsage();
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

runAnalysis();
