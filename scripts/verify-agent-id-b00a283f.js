require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function verifyAgentId() {
  console.log(`🔍 Vérification de l'agent_id: ${AGENT_ID}\n`);
  
  // 1. Vérifier si cet agent_id existe dans profiles
  console.log('👤 Vérification dans la table profiles:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, role, phone, created_at')
    .eq('user_id', AGENT_ID)
    .single();
  
  if (profileError) {
    console.log(`❌ Erreur récupération profil: ${profileError.message}`);
  } else {
    console.log(`✅ Profil trouvé:`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   User ID: ${profile.user_id}`);
    console.log(`   Nom: ${profile.display_name || 'N/A'}`);
    console.log(`   Rôle: ${profile.role}`);
    console.log(`   Téléphone: ${profile.phone || 'N/A'}`);
    console.log(`   Créé: ${profile.created_at}`);
  }
  
  // 2. Vérifier les visites de cet agent
  console.log('\n📅 Visites de cet agent:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, producer_id, visit_date, status, created_at')
    .eq('agent_id', AGENT_ID)
    .order('created_at', { ascending: false });
  
  if (visitsError) {
    console.log(`❌ Erreur récupération visites: ${visitsError.message}`);
  } else {
    console.log(`✅ Visites trouvées: ${visits?.length || 0}`);
    if (visits && visits.length > 0) {
      visits.slice(0, 5).forEach((visit, index) => {
        console.log(`   ${index + 1}. ${visit.id}`);
        console.log(`      Date: ${visit.visit_date}`);
        console.log(`      Statut: ${visit.status}`);
        console.log(`      Créée: ${visit.created_at}`);
      });
    }
  }
  
  // 3. Tester la création d'une visite avec cet agent_id
  console.log('\n🧪 Test de création de visite avec cet agent_id:');
  console.log('──────────────────────────────────────────────────');
  
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
    
    console.log(`🧪 Test avec:`);
    console.log(`   Agent ID: ${AGENT_ID}`);
    console.log(`   Producteur: ${testProducer.first_name} ${testProducer.last_name} (${testProducer.id})`);
    console.log(`   Parcelle: ${testPlot.name_season_snapshot} (${testPlot.id})`);
    
    // Tester la création
    const testVisit = {
      agent_id: AGENT_ID,
      producer_id: testProducer.id,
      plot_id: testPlot.id,
      visit_date: new Date().toISOString(),
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 30,
      notes: `Test avec agent_id ${AGENT_ID} - ${new Date().toISOString()}`
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
      console.log(`   Hint: ${createError.hint}`);
    } else {
      console.log(`✅ Visite créée avec succès: ${newVisit?.[0]?.id}`);
      console.log(`   Agent ID: ${newVisit?.[0]?.agent_id}`);
      console.log(`   Producteur: ${newVisit?.[0]?.producer_id}`);
      console.log(`   Parcelle: ${newVisit?.[0]?.plot_id}`);
      
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
  
  // 4. Vérifier les RPCs dashboard pour cet agent
  console.log('\n📊 Test des RPCs dashboard pour cet agent:');
  console.log('──────────────────────────────────────────────────');
  
  // Tester get_agent_dashboard_stats
  const { data: stats, error: statsError } = await supabase
    .rpc('get_agent_dashboard_stats', { p_agent_id: AGENT_ID });
  
  if (statsError) {
    console.log(`❌ Erreur get_agent_dashboard_stats: ${statsError.message}`);
  } else {
    console.log(`✅ get_agent_dashboard_stats: ${JSON.stringify(stats, null, 2)}`);
  }
  
  // Tester get_agent_today_visits
  const { data: todayVisits, error: todayError } = await supabase
    .rpc('get_agent_today_visits', { p_agent_id: AGENT_ID });
  
  if (todayError) {
    console.log(`❌ Erreur get_agent_today_visits: ${todayError.message}`);
  } else {
    console.log(`✅ get_agent_today_visits: ${todayVisits?.length || 0} visites`);
    if (todayVisits && todayVisits.length > 0) {
      console.log(`   Première visite: ${todayVisits[0]?.id || 'N/A'}`);
    }
  }
  
  // Tester get_agent_terrain_alerts
  const { data: alerts, error: alertsError } = await supabase
    .rpc('get_agent_terrain_alerts', { p_agent_id: AGENT_ID });
  
  if (alertsError) {
    console.log(`❌ Erreur get_agent_terrain_alerts: ${alertsError.message}`);
  } else {
    console.log(`✅ get_agent_terrain_alerts: ${alerts?.length || 0} alertes`);
  }
  
  console.log('\n🎯 RÉSULTAT:');
  console.log('──────────────────────────────────────────────────');
  if (profile && !createError) {
    console.log('✅ L\'agent_id est valide et fonctionne correctement');
    console.log('🔧 Le problème dans l\'app mobile est probablement:');
    console.log('   1. Problème d\'authentification (RLS)');
    console.log('   2. Problème de session expirée');
    console.log('   3. Problème de permissions');
  } else {
    console.log('❌ L\'agent_id a un problème');
  }
}

// Exécuter la vérification
async function runVerify() {
  try {
    await verifyAgentId();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

runVerify();
