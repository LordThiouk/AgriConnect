require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMobileAgentIdSource() {
  console.log('🔍 Debug de la source de l\'agent_id dans l\'app mobile\n');
  
  // 1. Vérifier l'état actuel de la contrainte FK
  console.log('🔗 État actuel de la contrainte FK:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: constraintInfo, error: constraintError } = await supabase
    .rpc('get_constraint_info', { table_name: 'visits', column_name: 'agent_id' });
  
  if (constraintError) {
    console.log(`❌ Erreur récupération contrainte: ${constraintError.message}`);
  } else {
    console.log(`✅ Contrainte: ${constraintInfo?.constraint_name || 'N/A'}`);
    console.log(`   Référence: ${constraintInfo?.foreign_table_name || 'N/A'}.${constraintInfo?.foreign_column_name || 'N/A'}`);
  }
  
  // 2. Vérifier les profils agents et leurs user_id
  console.log('\n👤 Profils agents et leurs user_id:');
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
      console.log(`   ${index + 1}. Profil ID: ${agent.id}`);
      console.log(`      User ID: ${agent.user_id}`);
      console.log(`      Nom: ${agent.display_name || 'N/A'}`);
      console.log(`      Téléphone: ${agent.phone || 'N/A'}`);
      console.log('');
    });
  }
  
  // 3. Vérifier les visites existantes
  console.log('📅 Visites existantes:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, visit_date, status')
    .order('created_at', { ascending: false })
    .limit(5);
  
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
      
      // Vérifier la correspondance
      const matchingAgent = agents?.find(a => a.user_id === visit.agent_id);
      if (matchingAgent) {
        console.log(`      ✅ Correspondance: ${matchingAgent.display_name}`);
      } else {
        console.log(`      ❌ Aucune correspondance trouvée`);
      }
      console.log('');
    });
  }
  
  // 4. Tester la création d'une visite avec un user_id valide
  console.log('🧪 Test de création avec user_id valide:');
  console.log('──────────────────────────────────────────────────');
  
  if (agents && agents.length > 0) {
    const testAgent = agents[0];
    console.log(`🧪 Test avec l'agent: ${testAgent.display_name}`);
    console.log(`   User ID: ${testAgent.user_id}`);
    
    // Récupérer un producteur et une parcelle valides
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (producersError) {
      console.log(`❌ Erreur récupération producteurs: ${producersError.message}`);
      return;
    }
    
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, name_season_snapshot')
      .limit(1);
    
    if (plotsError) {
      console.log(`❌ Erreur récupération parcelles: ${plotsError.message}`);
      return;
    }
    
    if (producers && producers.length > 0 && plots && plots.length > 0) {
      const testProducer = producers[0];
      const testPlot = plots[0];
      
      console.log(`   Producteur: ${testProducer.first_name} ${testProducer.last_name} (${testProducer.id})`);
      console.log(`   Parcelle: ${testPlot.name_season_snapshot} (${testPlot.id})`);
      
      // Tester la création avec user_id
      const testVisit = {
        agent_id: testAgent.user_id, // Utiliser user_id
        producer_id: testProducer.id,
        plot_id: testPlot.id,
        visit_date: new Date().toISOString(),
        visit_type: 'routine',
        status: 'scheduled',
        duration_minutes: 30,
        notes: `Test avec user_id - ${new Date().toISOString()}`
      };
      
      console.log('\n🧪 Création de la visite de test...');
      const { data: newVisit, error: createError } = await supabase
        .from('visits')
        .insert(testVisit)
        .select();
      
      if (createError) {
        console.log(`❌ Erreur création: ${createError.message}`);
        console.log(`   Code: ${createError.code}`);
        console.log(`   Détails: ${createError.details}`);
      } else {
        console.log(`✅ Visite créée avec succès: ${newVisit?.[0]?.id}`);
        console.log(`   Agent ID: ${newVisit?.[0]?.agent_id}`);
        
        // Nettoyer
        const { error: deleteError } = await supabase
          .from('visits')
          .delete()
          .eq('id', newVisit[0].id);
        
        if (deleteError) {
          console.log(`⚠️ Erreur suppression: ${deleteError.message}`);
        } else {
          console.log('🧹 Visite de test supprimée');
        }
      }
    }
  }
  
  // 5. Vérifier les RPCs qui pourraient retourner des agent_id incorrects
  console.log('\n🔍 Vérification des RPCs dashboard:');
  console.log('──────────────────────────────────────────────────');
  
  if (agents && agents.length > 0) {
    const testAgentId = agents[0].user_id;
    console.log(`🧪 Test RPC avec agent: ${testAgentId}`);
    
    // Tester get_agent_today_visits
    const { data: todayVisits, error: todayError } = await supabase
      .rpc('get_agent_today_visits', { p_agent_id: testAgentId });
    
    if (todayError) {
      console.log(`❌ Erreur get_agent_today_visits: ${todayError.message}`);
    } else {
      console.log(`✅ get_agent_today_visits: ${todayVisits?.length || 0} visites`);
      if (todayVisits && todayVisits.length > 0) {
        console.log(`   Première visite agent_id: ${todayVisits[0]?.agent_id || 'N/A'}`);
      }
    }
    
    // Tester get_agent_dashboard_stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_agent_dashboard_stats', { p_agent_id: testAgentId });
    
    if (statsError) {
      console.log(`❌ Erreur get_agent_dashboard_stats: ${statsError.message}`);
    } else {
      console.log(`✅ get_agent_dashboard_stats: ${JSON.stringify(stats, null, 2)}`);
    }
  }
  
  console.log('\n🎯 DIAGNOSTIC:');
  console.log('──────────────────────────────────────────────────');
  console.log('Si la création de visite échoue avec user_id valide,');
  console.log('le problème est ailleurs (RLS, authentification, etc.)');
  console.log('Si elle réussit, le problème est que l\'app mobile');
  console.log('utilise un agent_id incorrect ou non authentifié.');
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugMobileAgentIdSource();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
