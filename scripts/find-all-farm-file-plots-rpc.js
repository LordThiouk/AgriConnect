#!/usr/bin/env node

/**
 * Script pour trouver TOUTES les fonctions RPC utilisant farm_file_plots
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2ducWJ5bWJsbnlqY29jcXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODkzMDUsImV4cCI6MjA0NDA2NTMwNX0.1uYtxBHD2t7q2VbUyYpZ8j35ioUtMOgVcWx2vKRLOUw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllFunctions() {
  console.log('🔍 Recherche de TOUTES les fonctions RPC\n');
  console.log('═'.repeat(80));

  // Requête pour lister toutes les fonctions du schéma public
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'st_%'
      ORDER BY p.proname;
    `
  });

  if (error) {
    console.error('❌ Erreur:', error);
    console.log('\n⚠️  Utilisation d\'une approche alternative...\n');
    return await findFunctionsAlternative();
  }

  console.log(`\n✅ ${data.length} fonctions trouvées\n`);

  const problemFunctions = [];
  
  for (const func of data) {
    if (func.definition && func.definition.toLowerCase().includes('farm_file_plots')) {
      problemFunctions.push(func.function_name);
      console.log(`❌ ${func.function_name} utilise farm_file_plots`);
    }
  }

  if (problemFunctions.length === 0) {
    console.log('\n✅ Aucune fonction n\'utilise farm_file_plots');
  } else {
    console.log(`\n⚠️  ${problemFunctions.length} fonction(s) à corriger:\n`);
    problemFunctions.forEach(fn => console.log(`   - ${fn}`));
  }

  console.log('\n' + '═'.repeat(80));
}

async function findFunctionsAlternative() {
  console.log('📋 Liste des fonctions candidates à vérifier:\n');
  
  const candidateFunctions = [
    'get_operations_with_details',
    'get_operations_with_details_v2',
    'get_operations_with_details_v3',
    'get_observations_with_details',
    'get_observations_with_details_v2',
    'get_observations_with_details_v3',
    'count_operations_for_producer',
    'count_operations_for_producer_v2',
    'count_operations_for_producer_v3',
    'count_observations_for_producer',
    'count_observations_for_producer_v2',
    'count_observations_for_producer_v3',
    'get_operations_for_agent',
    'get_observations_for_agent',
    'get_plot_by_id',
    'get_plot_by_id_with_details'
  ];

  console.log('Fonctions à tester:');
  candidateFunctions.forEach(fn => console.log(`  - ${fn}`));
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n🧪 Test de chaque fonction...\n');

  for (const funcName of candidateFunctions) {
    const { error } = await supabase.rpc(funcName, {}).limit(1);
    
    if (error) {
      if (error.message && error.message.includes('farm_file_plots')) {
        console.log(`❌ ${funcName}: utilise farm_file_plots`);
      } else if (error.code === '42883') {
        console.log(`⚠️  ${funcName}: n'existe pas`);
      } else {
        console.log(`⚠️  ${funcName}: autre erreur (${error.code})`);
      }
    } else {
      console.log(`✅ ${funcName}: OK`);
    }
  }

  console.log('\n' + '═'.repeat(80));
}

findAllFunctions().catch(console.error);

