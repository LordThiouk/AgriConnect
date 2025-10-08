/**
 * Créer des visites supplémentaires pour l'agent Seydou Sene avec noms de parcelles
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

async function createAdditionalVisitsForAgent() {
  console.log('🔍 Création de visites supplémentaires pour Seydou Sene\n');
  console.log('═'.repeat(80));
  
  const agentId = '0f33842a-a1f1-4ad5-8113-39285e5013df';
  
  // 1. Vérifier l'agent
  console.log('1️⃣ Vérification de l\'agent:');
  const { data: agent, error: agentError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name')
    .eq('id', agentId)
    .single();
  
  if (agentError || !agent) {
    console.error('❌ Agent non trouvé:', agentError);
    return;
  }
  
  console.log(`✅ Agent trouvé: ${agent.display_name} (${agent.user_id})`);
  
  // 2. Récupérer les producteurs assignés
  console.log('\n2️⃣ Récupération des producteurs assignés:');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agent_assignments')
    .select('assigned_to_id, assigned_to_type')
    .eq('agent_id', agentId)
    .eq('assigned_to_type', 'producer');
  
  if (assignmentsError || !assignments || assignments.length === 0) {
    console.error('❌ Aucun producteur assigné:', assignmentsError);
    return;
  }
  
  console.log(`✅ ${assignments.length} producteurs assignés`);
  
  // 3. Récupérer les détails des producteurs
  const producerIds = assignments.map(a => a.assigned_to_id);
  const { data: producers, error: producersError } = await supabase
    .from('producers')
    .select('id, first_name, last_name')
    .in('id', producerIds);
  
  if (producersError) {
    console.error('❌ Erreur récupération producteurs:', producersError);
    return;
  }
  
  console.log(`✅ ${producers.length} producteurs trouvés`);
  
  // 4. Récupérer les parcelles avec leurs noms
  console.log('\n3️⃣ Récupération des parcelles avec noms:');
  const { data: plots, error: plotsError } = await supabase
    .from('plots')
    .select('id, name_season_snapshot, area_hectares, producer_id, status')
    .in('producer_id', producerIds)
    .eq('status', 'active');
  
  if (plotsError) {
    console.error('❌ Erreur récupération parcelles:', plotsError);
    return;
  }
  
  console.log(`✅ ${plots.length} parcelles actives trouvées:`);
  plots.forEach((plot, index) => {
    const producer = producers.find(p => p.id === plot.producer_id);
    console.log(`   ${index + 1}. ${plot.name_season_snapshot} - ${plot.area_hectares} ha (${producer?.first_name || 'Inconnu'})`);
  });
  
  // 5. Créer des visites pour aujourd'hui
  console.log('\n4️⃣ Création des visites pour aujourd\'hui:');
  const today = new Date().toISOString().split('T')[0];
  
  // Prendre les 3 premières parcelles pour créer des visites
  const plotsToUse = plots.slice(0, 3);
  
  for (let i = 0; i < plotsToUse.length; i++) {
    const plot = plotsToUse[i];
    const producer = producers.find(p => p.id === plot.producer_id);
    
    const visitData = {
      producer_id: plot.producer_id,
      plot_id: plot.id,
      agent_id: agentId,
      visit_date: today,
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 45,
      notes: `Visite de routine - ${producer?.first_name} ${producer?.last_name} - ${plot.name_season_snapshot}`,
      weather_conditions: 'sunny'
    };
    
    console.log(`   Création visite ${i + 1}: ${producer?.first_name} - ${plot.name_season_snapshot}`);
    
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert(visitData)
      .select('id')
      .single();
    
    if (visitError) {
      console.error(`   ❌ Erreur création visite ${i + 1}:`, visitError.message);
    } else {
      console.log(`   ✅ Visite ${i + 1} créée: ${visit.id}`);
    }
  }
  
  // 6. Vérifier toutes les visites de l'agent pour aujourd'hui
  console.log('\n5️⃣ Vérification des visites de l\'agent pour aujourd\'hui:');
  const { data: allVisits, error: allVisitsError } = await supabase
    .from('visits')
    .select(`
      id, 
      producer_id, 
      plot_id, 
      agent_id, 
      visit_date, 
      status,
      notes,
      producers!inner(first_name, last_name),
      plots!inner(name_season_snapshot, area_hectares)
    `)
    .eq('agent_id', agentId)
    .eq('visit_date', today)
    .order('created_at', { ascending: false });
  
  if (allVisitsError) {
    console.error('❌ Erreur vérification visites:', allVisitsError);
  } else {
    console.log(`✅ ${allVisits?.length || 0} visites totales pour l'agent ${agent.display_name} aujourd'hui:`);
    allVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id}`);
      console.log(`      Producteur: ${visit.producers.first_name} ${visit.producers.last_name}`);
      console.log(`      Parcelle: ${visit.plots.name_season_snapshot} (${visit.plots.area_hectares} ha)`);
      console.log(`      Statut: ${visit.status} - ${visit.visit_date}`);
      console.log(`      Notes: ${visit.notes}`);
      console.log('');
    });
  }
  
  // 7. Tester le RPC get_agent_today_visits
  console.log('6️⃣ Test du RPC get_agent_today_visits:');
  const { data: rpcVisits, error: rpcError } = await supabase
    .rpc('get_agent_today_visits', { p_user_id: agentId });
  
  if (rpcError) {
    console.error('❌ Erreur RPC:', rpcError);
  } else {
    console.log(`✅ RPC retourne ${rpcVisits?.length || 0} visites:`);
    rpcVisits?.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.id}`);
      console.log(`      Producteur: ${visit.producer}`);
      console.log(`      Parcelle: ${visit.location}`);
      console.log(`      Statut: ${visit.status}`);
      console.log(`      GPS: ${visit.has_gps ? 'Oui' : 'Non'}`);
      console.log(`      Durée: ${visit.duration_minutes} min`);
      console.log('');
    });
  }
}

createAdditionalVisitsForAgent().catch(console.error);
