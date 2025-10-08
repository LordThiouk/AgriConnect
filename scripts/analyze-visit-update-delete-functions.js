/**
 * Analyse des fonctions update_visit_status et delete_visits
 * Détermine leurs signatures et vérifie si elles utilisent farm_file_plots/agent_producer_assignments
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

async function analyzeVisitFunctions() {
  console.log('🔍 Analyse des fonctions update_visit_status et delete_visits\n');
  console.log('═'.repeat(80));
  
  // Test 1: update_visit_status
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║           update_visit_status                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Essayer différentes signatures possibles
  const updateTestCases = [
    { name: 'Signature 1: (visit_id uuid, new_status text)', params: { visit_id: '00000000-0000-0000-0000-000000000000', new_status: 'completed' } },
    { name: 'Signature 2: (p_visit_id uuid, p_status text)', params: { p_visit_id: '00000000-0000-0000-0000-000000000000', p_status: 'completed' } },
    { name: 'Signature 3: (id uuid, status text)', params: { id: '00000000-0000-0000-0000-000000000000', status: 'completed' } },
  ];
  
  for (const test of updateTestCases) {
    console.log(`\n─ ${test.name} ──────────────────────`);
    const { data, error } = await supabase.rpc('update_visit_status', test.params);
    
    if (error) {
      if (error.code === 'PGRST202') {
        console.log(`  ❌ Paramètres incorrects: ${error.message}`);
      } else if (error.code === '23503') {
        console.log(`  ✅ SIGNATURE TROUVÉE ! (FK error attendue)`);
        console.log(`     Paramètres: ${JSON.stringify(test.params)}`);
        
        if (error.message.includes('farm_file_plots')) {
          console.log(`\n     ⚠️  ALERTE: Utilise farm_file_plots (obsolète) !`);
        }
        if (error.message.includes('agent_producer_assignments')) {
          console.log(`\n     ⚠️  ALERTE: Utilise agent_producer_assignments (obsolète) !`);
        }
        break;
      } else {
        console.log(`  ⚠️  ${error.code}: ${error.message}`);
        if (error.message.includes('farm_file_plots')) {
          console.log(`\n     ⚠️  ALERTE: Utilise farm_file_plots (obsolète) !`);
        }
        if (error.message.includes('agent_producer_assignments')) {
          console.log(`\n     ⚠️  ALERTE: Utilise agent_producer_assignments (obsolète) !`);
        }
      }
    } else {
      console.log(`  ✅ Succès (données): ${JSON.stringify(data)}`);
      break;
    }
  }
  
  // Test 2: delete_visits
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║                delete_visits                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const deleteTestCases = [
    { name: 'Signature 1: (visit_id uuid)', params: { visit_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'Signature 2: (p_visit_id uuid)', params: { p_visit_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'Signature 3: (id uuid)', params: { id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'Signature 4: (visit_ids uuid[])', params: { visit_ids: ['00000000-0000-0000-0000-000000000000'] } },
  ];
  
  for (const test of deleteTestCases) {
    console.log(`\n─ ${test.name} ──────────────────────`);
    const { data, error } = await supabase.rpc('delete_visits', test.params);
    
    if (error) {
      if (error.code === 'PGRST202') {
        console.log(`  ❌ Paramètres incorrects: ${error.message}`);
      } else {
        console.log(`  ✅ SIGNATURE TROUVÉE !`);
        console.log(`     Paramètres: ${JSON.stringify(test.params)}`);
        console.log(`     Erreur attendue: ${error.code} - ${error.message}`);
        
        if (error.message.includes('farm_file_plots')) {
          console.log(`\n     ⚠️  ALERTE: Utilise farm_file_plots (obsolète) !`);
        }
        if (error.message.includes('agent_producer_assignments')) {
          console.log(`\n     ⚠️  ALERTE: Utilise agent_producer_assignments (obsolète) !`);
        }
        break;
      }
    } else {
      console.log(`  ✅ Succès: ${JSON.stringify(data)}`);
      break;
    }
  }
  
  // Test 3: Vérifier avec une vraie visite
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║        Test avec une visite réelle                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, status, producer_id, plot_id')
    .limit(1);
  
  if (visitsError) {
    console.log(`❌ Erreur récupération visite: ${visitsError.message}`);
  } else if (visits && visits.length > 0) {
    const visit = visits[0];
    console.log(`✅ Visite trouvée: ${visit.id}`);
    console.log(`   Status actuel: ${visit.status}`);
    console.log(`   plot_id: ${visit.plot_id}`);
    console.log(`   producer_id: ${visit.producer_id}`);
    
    // Essayer update_visit_status avec ID réel
    console.log(`\n─ Test update_visit_status avec ID réel ──────────`);
    const { data: updateData, error: updateError } = await supabase
      .rpc('update_visit_status', { 
        visit_id: visit.id, 
        new_status: visit.status  // Même statut pour ne pas modifier
      });
    
    if (updateError) {
      console.log(`   ❌ ${updateError.code}: ${updateError.message}`);
      
      if (updateError.message.includes('farm_file_plots')) {
        console.log(`\n   🚨 PROBLÈME DÉTECTÉ: Utilise farm_file_plots (obsolète) !`);
      }
      if (updateError.message.includes('agent_producer_assignments')) {
        console.log(`\n   🚨 PROBLÈME DÉTECTÉ: Utilise agent_producer_assignments (obsolète) !`);
      }
    } else {
      console.log(`   ✅ Succès: ${JSON.stringify(updateData)}`);
    }
  } else {
    console.log('⚠️  Aucune visite trouvée pour le test');
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

analyzeVisitFunctions().catch(console.error);

