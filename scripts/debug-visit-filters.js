require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function debugVisitFilters() {
  console.log('🔍 Debug des filtres de visites\n');
  
  // 1. Vérifier les visites dans la table
  console.log('📊 Vérification des visites dans la table:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: allVisits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, visit_date, status, created_at')
    .order('visit_date', { ascending: false })
    .limit(10);
  
  if (visitsError) {
    console.error('❌ Erreur récupération visites:', visitsError);
    return;
  }
  
  console.log(`📋 Total des visites trouvées: ${allVisits?.length || 0}`);
  
  if (allVisits && allVisits.length > 0) {
    console.log('\n📅 Détails des visites:');
    allVisits.forEach((visit, index) => {
      const visitDate = new Date(visit.visit_date);
      const now = new Date();
      const isPast = visitDate < now;
      const isFuture = visitDate > now;
      const isToday = visitDate.toDateString() === now.toDateString();
      
      console.log(`   ${index + 1}. ID: ${visit.id}`);
      console.log(`      Agent: ${visit.agent_id}`);
      console.log(`      Date: ${visit.visit_date}`);
      console.log(`      Statut: ${visit.status}`);
      console.log(`      Type: ${isToday ? 'Aujourd\'hui' : isPast ? 'Passée' : 'Future'}`);
      console.log('');
    });
  }
  
  // 2. Tester le RPC get_agent_all_visits_with_filters
  console.log('🧪 Test du RPC get_agent_all_visits_with_filters:');
  console.log('──────────────────────────────────────────────────');
  
  const filters = ['today', 'week', 'month', 'past', 'future', 'all'];
  
  for (const filter of filters) {
    console.log(`\n🔍 Filtre: ${filter}`);
    
    try {
      const { data, error } = await supabase.rpc('get_agent_all_visits_with_filters', {
        p_user_id: TEST_AGENT_ID,
        p_filter: filter
      });
      
      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Détails: ${error.details}`);
      } else {
        console.log(`   ✅ Résultat: ${data?.length || 0} visites`);
        
        if (data && data.length > 0) {
          data.slice(0, 3).forEach((visit, index) => {
            console.log(`      ${index + 1}. ${visit.producer} - ${visit.location}`);
            console.log(`         Date: ${visit.visit_date}, Statut: ${visit.status}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur générale: ${error.message}`);
    }
  }
  
  // 3. Vérifier les visites par agent_id directement
  console.log('\n👤 Vérification des visites par agent_id:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agentVisits, error: agentError } = await supabase
    .from('visits')
    .select('id, agent_id, visit_date, status')
    .eq('agent_id', TEST_AGENT_ID)
    .order('visit_date', { ascending: false });
  
  if (agentError) {
    console.error('❌ Erreur récupération visites agent:', agentError);
  } else {
    console.log(`📋 Visites pour l'agent ${TEST_AGENT_ID}: ${agentVisits?.length || 0}`);
    
    if (agentVisits && agentVisits.length > 0) {
      agentVisits.forEach((visit, index) => {
        const visitDate = new Date(visit.visit_date);
        const now = new Date();
        const isPast = visitDate < now;
        const isFuture = visitDate > now;
        const isToday = visitDate.toDateString() === now.toDateString();
        
        console.log(`   ${index + 1}. Date: ${visit.visit_date}`);
        console.log(`      Statut: ${visit.status}`);
        console.log(`      Type: ${isToday ? 'Aujourd\'hui' : isPast ? 'Passée' : 'Future'}`);
      });
    }
  }
  
  // 4. Tester la logique de filtrage manuellement
  console.log('\n🧮 Test de la logique de filtrage manuelle:');
  console.log('──────────────────────────────────────────────────');
  
  if (agentVisits && agentVisits.length > 0) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const pastVisits = agentVisits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate < today;
    });
    
    const todayVisits = agentVisits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate.toDateString() === today.toDateString();
    });
    
    const futureVisits = agentVisits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate > today;
    });
    
    const weekVisits = agentVisits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= today && visitDate <= weekFromNow;
    });
    
    const monthVisits = agentVisits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= today && visitDate <= monthFromNow;
    });
    
    console.log(`📊 Résultats manuels:`);
    console.log(`   Aujourd'hui: ${todayVisits.length} visites`);
    console.log(`   Cette semaine: ${weekVisits.length} visites`);
    console.log(`   Ce mois: ${monthVisits.length} visites`);
    console.log(`   Passées: ${pastVisits.length} visites`);
    console.log(`   À venir: ${futureVisits.length} visites`);
    console.log(`   Toutes: ${agentVisits.length} visites`);
  }
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugVisitFilters();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
