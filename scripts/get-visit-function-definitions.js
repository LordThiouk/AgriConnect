/**
 * Script pour récupérer la définition des fonctions RPC visits depuis PostgreSQL
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

async function getFunctionDefinitions() {
  console.log('🔍 Récupération des définitions des fonctions visits\n');
  console.log('═'.repeat(80));
  
  const functions = [
    'update_visit_status',
    'delete_visits',
    'delete_visit',
    'update_visit',
    'create_visit'
  ];
  
  for (const funcName of functions) {
    console.log(`\n\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  ${funcName.padEnd(52)} ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);
    
    // Requête pour récupérer la définition de la fonction
    const query = `
      SELECT 
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_definition,
        pg_get_function_arguments(p.oid) AS arguments,
        pg_get_function_result(p.oid) AS return_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = '${funcName}';
    `;
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.log(`❌ Erreur: ${error.message}`);
        
        // Alternative: essayer avec une requête directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(result);
        } else {
          console.log(`⚠️  Fonction ${funcName} non accessible via exec_sql`);
          
          // Essayons avec une approche différente - analyser les messages d'erreur
          const { error: testError } = await supabase.rpc(funcName, { 
            visit_id: '00000000-0000-0000-0000-000000000000',
            new_status: 'completed'
          });
          
          if (testError) {
            console.log(`\n📋 Signature détectée via erreur:`);
            console.log(`   ${testError.message}`);
            
            // Extraire les paramètres de l'erreur
            if (testError.message.includes('farm_file_plots')) {
              console.log(`\n   ⚠️  ATTENTION: Utilise farm_file_plots (obsolète)`);
            }
            if (testError.message.includes('agent_producer_assignments')) {
              console.log(`\n   ⚠️  ATTENTION: Utilise agent_producer_assignments (obsolète)`);
            }
          }
        }
      } else {
        console.log('✅ Définition récupérée:\n');
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(`❌ Erreur: ${e.message}`);
    }
  }
  
  console.log('\n\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

getFunctionDefinitions().catch(console.error);

