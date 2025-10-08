require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAgentIdMismatch() {
  console.log('🔍 Debug de la correspondance agent_id dans l\'app mobile\n');
  
  // 1. Vérifier tous les profils agents disponibles
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
  
  // 2. Vérifier les visites existantes et leurs agent_id
  console.log('📅 Visites existantes et leurs agent_id:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, visit_date, status')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (visitsError) {
    console.log(`❌ Erreur récupération visites: ${visitsError.message}`);
    return;
  }
  
  console.log(`✅ Visites trouvées: ${visits?.length || 0}`);
  if (visits && visits.length > 0) {
    visits.forEach((visit, index) => {
      console.log(`   ${index + 1}. Visite: ${visit.id}`);
      console.log(`      Agent ID: ${visit.agent_id}`);
      console.log(`      Date: ${visit.visit_date}`);
      console.log(`      Statut: ${visit.status}`);
      
      // Vérifier si cet agent_id existe dans profiles
      const matchingAgent = agents?.find(a => a.user_id === visit.agent_id);
      if (matchingAgent) {
        console.log(`      ✅ Correspondance: ${matchingAgent.display_name}`);
      } else {
        console.log(`      ❌ Aucune correspondance dans profiles`);
      }
      console.log('');
    });
  }
  
  // 3. Vérifier les IDs qui ne correspondent pas
  console.log('❌ Agent IDs sans correspondance dans profiles:');
  console.log('──────────────────────────────────────────────────');
  
  if (visits && agents) {
    const visitAgentIds = [...new Set(visits.map(v => v.agent_id))];
    const profileUserIds = agents.map(a => a.user_id);
    
    const orphanedAgentIds = visitAgentIds.filter(agentId => 
      !profileUserIds.includes(agentId)
    );
    
    if (orphanedAgentIds.length > 0) {
      console.log(`❌ ${orphanedAgentIds.length} agent_id(s) orphelins:`);
      orphanedAgentIds.forEach((agentId, index) => {
        console.log(`   ${index + 1}. ${agentId}`);
      });
    } else {
      console.log('✅ Tous les agent_id ont une correspondance dans profiles');
    }
  }
  
  // 4. Vérifier les user_id qui ne sont pas utilisés dans visits
  console.log('\n🔍 User IDs non utilisés dans visits:');
  console.log('──────────────────────────────────────────────────');
  
  if (visits && agents) {
    const visitAgentIds = [...new Set(visits.map(v => v.agent_id))];
    const profileUserIds = agents.map(a => a.user_id);
    
    const unusedUserIds = profileUserIds.filter(userId => 
      !visitAgentIds.includes(userId)
    );
    
    if (unusedUserIds.length > 0) {
      console.log(`🔍 ${unusedUserIds.length} user_id(s) non utilisés:`);
      unusedUserIds.forEach((userId, index) => {
        const agent = agents.find(a => a.user_id === userId);
        console.log(`   ${index + 1}. ${userId} (${agent?.display_name || 'N/A'})`);
      });
    } else {
      console.log('✅ Tous les user_id sont utilisés dans visits');
    }
  }
  
  // 5. Simuler le problème de l'app mobile
  console.log('\n📱 Simulation du problème de l\'app mobile:');
  console.log('──────────────────────────────────────────────────');
  
  // L'app mobile utilise probablement l'ID du profil au lieu du user_id
  if (agents && agents.length > 0) {
    const testAgent = agents[0];
    console.log(`🧪 Test avec l'agent: ${testAgent.display_name}`);
    console.log(`   Profil ID: ${testAgent.id}`);
    console.log(`   User ID: ${testAgent.user_id}`);
    
    // Essayer de créer une visite avec le profil ID (comme l'app mobile pourrait le faire)
    const testVisitWithProfileId = {
      agent_id: testAgent.id, // Utiliser l'ID du profil au lieu du user_id
      producer_id: 'test-producer-id',
      plot_id: 'test-plot-id',
      visit_date: new Date().toISOString(),
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 30,
      notes: 'Test avec profil ID'
    };
    
    console.log('\n🧪 Test création avec profil ID (comme l\'app mobile):');
    const { data: testVisit1, error: testError1 } = await supabase
      .from('visits')
      .insert(testVisitWithProfileId)
      .select();
    
    if (testError1) {
      console.log(`❌ Erreur avec profil ID: ${testError1.message}`);
      console.log(`   Code: ${testError1.code}`);
      console.log(`   Détails: ${testError1.details}`);
    } else {
      console.log('✅ Création réussie avec profil ID');
      // Nettoyer
      await supabase.from('visits').delete().eq('id', testVisit1[0].id);
    }
    
    // Essayer de créer une visite avec le user_id (correct)
    const testVisitWithUserId = {
      agent_id: testAgent.user_id, // Utiliser le user_id correct
      producer_id: 'test-producer-id',
      plot_id: 'test-plot-id',
      visit_date: new Date().toISOString(),
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 30,
      notes: 'Test avec user ID'
    };
    
    console.log('\n🧪 Test création avec user ID (correct):');
    const { data: testVisit2, error: testError2 } = await supabase
      .from('visits')
      .insert(testVisitWithUserId)
      .select();
    
    if (testError2) {
      console.log(`❌ Erreur avec user ID: ${testError2.message}`);
    } else {
      console.log('✅ Création réussie avec user ID');
      // Nettoyer
      await supabase.from('visits').delete().eq('id', testVisit2[0].id);
    }
  }
  
  console.log('\n🎯 DIAGNOSTIC:');
  console.log('──────────────────────────────────────────────────');
  console.log('Le problème est probablement que l\'app mobile utilise');
  console.log('l\'ID du profil (profiles.id) au lieu du user_id (profiles.user_id)');
  console.log('pour l\'agent_id dans les visites.');
  console.log('');
  console.log('🔧 SOLUTIONS:');
  console.log('1. Modifier l\'app mobile pour utiliser profiles.user_id');
  console.log('2. Ou modifier la contrainte FK pour pointer vers profiles.id');
  console.log('3. Ou créer une correspondance entre les deux IDs');
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugAgentIdMismatch();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
