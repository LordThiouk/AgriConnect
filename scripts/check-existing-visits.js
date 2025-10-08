/**
 * Vérifier les visites existantes dans la base de données
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

async function checkExistingVisits() {
  console.log('🔍 Vérification des visites existantes\n');
  console.log('═'.repeat(80));
  
  // 1. Lister toutes les visites
  console.log('1️⃣ Toutes les visites dans la base:');
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, agent_id, visit_date, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (visitsError) {
    console.error('❌ Erreur lors de la récupération des visites:', visitsError);
    return;
  }
  
  if (!visits || visits.length === 0) {
    console.log('⚠️ Aucune visite trouvée dans la base de données');
    return;
  }
  
  console.log(`✅ ${visits.length} visites trouvées:`);
  visits.forEach((visit, index) => {
    console.log(`   ${index + 1}. ID: ${visit.id}`);
    console.log(`      Producteur: ${visit.producer_id}`);
    console.log(`      Parcelle: ${visit.plot_id}`);
    console.log(`      Agent: ${visit.agent_id}`);
    console.log(`      Date: ${visit.visit_date}`);
    console.log(`      Statut: ${visit.status}`);
    console.log(`      Créé: ${visit.created_at}`);
    console.log('');
  });
  
  // 2. Vérifier spécifiquement l'ID problématique
  const problemVisitId = 'fee791c5-d01f-41cf-ae4a-98cb1e36fb08';
  console.log(`2️⃣ Vérification de l'ID problématique: ${problemVisitId}`);
  
  const { data: problemVisit, error: problemError } = await supabase
    .from('visits')
    .select('*')
    .eq('id', problemVisitId)
    .single();
  
  if (problemError) {
    console.log(`❌ Visite ${problemVisitId} non trouvée:`, problemError.message);
  } else {
    console.log(`✅ Visite ${problemVisitId} trouvée:`, problemVisit);
  }
  
  // 3. Tester le RPC get_visit_for_edit avec une visite existante
  if (visits.length > 0) {
    const testVisitId = visits[0].id;
    console.log(`3️⃣ Test du RPC get_visit_for_edit avec l'ID: ${testVisitId}`);
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_visit_for_edit', { p_visit_id: testVisitId });
    
    if (rpcError) {
      console.log(`❌ Erreur RPC:`, rpcError);
    } else {
      console.log(`✅ RPC fonctionne:`, rpcResult);
    }
  }
}

checkExistingVisits().catch(console.error);