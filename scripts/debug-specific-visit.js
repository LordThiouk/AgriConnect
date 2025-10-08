/**
 * Vérifier spécifiquement l'ID de visite problématique
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

async function debugSpecificVisit() {
  console.log('🔍 Vérification spécifique de la visite problématique\n');
  console.log('═'.repeat(80));
  
  const problemVisitId = '6203b6b6-f530-4971-b62d-26f4c570058c';
  
  // 1. Vérifier si la visite existe dans la table visits
  console.log('1️⃣ Vérification directe dans la table visits:');
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('*')
    .eq('id', problemVisitId)
    .single();
  
  if (visitError) {
    console.log('❌ Erreur:', visitError.message);
    console.log('   Code:', visitError.code);
  } else if (visit) {
    console.log('✅ Visite trouvée:', visit);
  } else {
    console.log('⚠️ Visite non trouvée');
  }
  
  // 2. Vérifier avec le RPC get_visit_for_edit
  console.log('\n2️⃣ Test du RPC get_visit_for_edit:');
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('get_visit_for_edit', { p_visit_id: problemVisitId });
  
  if (rpcError) {
    console.log('❌ Erreur RPC:', rpcError.message);
    console.log('   Code:', rpcError.code);
    console.log('   Détails:', rpcError.details);
  } else if (rpcResult) {
    console.log('✅ RPC réussi:', rpcResult);
  } else {
    console.log('⚠️ RPC retourne null');
  }
  
  // 3. Vérifier toutes les visites pour voir si l'ID est similaire
  console.log('\n3️⃣ Recherche d\'IDs similaires:');
  const { data: allVisits, error: allVisitsError } = await supabase
    .from('visits')
    .select('id, producer_id, plot_id, visit_date, status')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (allVisitsError) {
    console.log('❌ Erreur lors de la récupération des visites:', allVisitsError.message);
  } else {
    console.log('📋 Toutes les visites (20 dernières):');
    allVisits.forEach((v, index) => {
      console.log(`   ${index + 1}. ${v.id} - ${v.visit_date} - ${v.status}`);
    });
    
    // Chercher des IDs similaires
    const similarIds = allVisits.filter(v => 
      v.id.includes('6203b6b6') || 
      v.id.includes('f530-4971') || 
      v.id.includes('b62d-26f4c570058c')
    );
    
    if (similarIds.length > 0) {
      console.log('\n🔍 IDs similaires trouvés:');
      similarIds.forEach(v => {
        console.log(`   - ${v.id} - ${v.visit_date} - ${v.status}`);
      });
    } else {
      console.log('\n⚠️ Aucun ID similaire trouvé');
    }
  }
  
  // 4. Vérifier les logs d'audit si disponibles
  console.log('\n4️⃣ Vérification des logs d\'audit:');
  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_logs')
    .select('*')
    .ilike('table_name', '%visit%')
    .ilike('record_id', `%${problemVisitId}%`)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (auditError) {
    console.log('⚠️ Pas de logs d\'audit ou erreur:', auditError.message);
  } else if (auditLogs && auditLogs.length > 0) {
    console.log('📋 Logs d\'audit trouvés:');
    auditLogs.forEach(log => {
      console.log(`   - ${log.action} sur ${log.table_name} (${log.record_id}) - ${log.created_at}`);
    });
  } else {
    console.log('⚠️ Aucun log d\'audit trouvé');
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Diagnostic terminé');
}

debugSpecificVisit().catch(console.error);
