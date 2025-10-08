/**
 * Script pour vérifier l'existence et la structure des RPC visits
 * Vérifie: update_visit_status, delete_visits, et autres fonctions liées aux visites
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisitRPCFunctions() {
  console.log('🔍 Vérification des RPC functions liées aux visites\n');
  console.log('═'.repeat(80));
  
  // Liste des fonctions à vérifier
  const functionsToCheck = [
    'update_visit_status',
    'delete_visits',
    'delete_visit',
    'get_agent_today_visits',
    'create_visit',
    'update_visit'
  ];
  
  console.log('\n📋 Recherche des fonctions dans pg_catalog...\n');
  
  // Requête pour lister toutes les fonctions contenant "visit"
  const { data: functions, error } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .ilike('proname', '%visit%');
  
  if (error) {
    console.log('⚠️  Impossible d\'interroger pg_proc directement');
    console.log('   Testant chaque fonction individuellement...\n');
    
    // Test individuel de chaque fonction
    for (const funcName of functionsToCheck) {
      console.log(`\n─ Test: ${funcName} ────────────────────────────────`);
      
      try {
        // Essayer d'appeler la fonction avec des params null
        const { data, error: funcError } = await supabase
          .rpc(funcName, {});
        
        if (funcError) {
          if (funcError.code === '42883') {
            console.log(`  ❌ Fonction ${funcName} N'EXISTE PAS`);
          } else {
            console.log(`  ✅ Fonction ${funcName} EXISTE`);
            console.log(`     Code erreur: ${funcError.code}`);
            console.log(`     Message: ${funcError.message}`);
          }
        } else {
          console.log(`  ✅ Fonction ${funcName} EXISTE et retourne:`, data);
        }
      } catch (e) {
        console.log(`  ❌ Erreur inattendue: ${e.message}`);
      }
    }
  } else {
    console.log('✅ Fonctions trouvées:\n');
    functions.forEach(func => {
      console.log(`  • ${func.proname}`);
    });
  }
  
  // Vérifier la structure de la table visits
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Structure de la table visits:\n');
  
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('*')
    .limit(1)
    .single();
  
  if (!visitError && visit) {
    console.log('Colonnes disponibles:');
    Object.keys(visit).forEach((key, idx) => {
      console.log(`  ${idx + 1}. ${key} (${typeof visit[key]})`);
    });
  } else {
    console.log('⚠️  Impossible de lire la structure:', visitError?.message);
  }
  
  // Vérifier les opérations possibles
  console.log('\n' + '═'.repeat(80));
  console.log('\n🔐 Vérification des permissions RLS:\n');
  
  // Test UPDATE
  console.log('Test UPDATE:');
  const { error: updateError } = await supabase
    .from('visits')
    .update({ status: 'completed' })
    .eq('id', '00000000-0000-0000-0000-000000000000'); // ID fictif
  
  if (updateError) {
    if (updateError.code === 'PGRST116') {
      console.log('  ✅ Opération UPDATE disponible (pas de correspondance attendue)');
    } else {
      console.log(`  ⚠️  UPDATE: ${updateError.code} - ${updateError.message}`);
    }
  } else {
    console.log('  ✅ Opération UPDATE disponible');
  }
  
  // Test DELETE
  console.log('\nTest DELETE:');
  const { error: deleteError } = await supabase
    .from('visits')
    .delete()
    .eq('id', '00000000-0000-0000-0000-000000000000'); // ID fictif
  
  if (deleteError) {
    if (deleteError.code === 'PGRST116') {
      console.log('  ✅ Opération DELETE disponible (pas de correspondance attendue)');
    } else {
      console.log(`  ⚠️  DELETE: ${deleteError.code} - ${deleteError.message}`);
    }
  } else {
    console.log('  ✅ Opération DELETE disponible');
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

checkVisitRPCFunctions().catch(console.error);

