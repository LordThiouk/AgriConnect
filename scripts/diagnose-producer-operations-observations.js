#!/usr/bin/env node

/**
 * Script de diagnostic: Opérations et Observations par producteur
 * Vérifie la liaison producers → plots → operations/observations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2ducWJ5bWJsbnlqY29jcXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODkzMDUsImV4cCI6MjA0NDA2NTMwNX0.1uYtxBHD2t7q2VbUyYpZ8j35ioUtMOgVcWx2vKRLOUw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnostic: Opérations et Observations par Producteur\n');
  console.log('═'.repeat(80));

  // 1. Récupérer un producteur
  const { data: producers, error: prodError } = await supabase
    .from('producers')
    .select('id, first_name, last_name')
    .limit(3);

  if (prodError) {
    console.error('❌ Erreur producers:', prodError);
    return;
  }

  console.log(`\n📊 ${producers.length} producteurs trouvés\n`);

  for (const producer of producers) {
    console.log('─'.repeat(80));
    console.log(`👤 Producteur: ${producer.first_name} ${producer.last_name} (${producer.id})`);
    console.log('─'.repeat(80));

    // 2. Trouver ses parcelles
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, name_season_snapshot, producer_id')
      .eq('producer_id', producer.id);

    if (plotsError) {
      console.error('❌ Erreur plots:', plotsError);
      continue;
    }

    console.log(`\n📍 Parcelles: ${plots?.length || 0}`);
    if (plots && plots.length > 0) {
      plots.forEach(p => console.log(`   - ${p.name_season_snapshot} (${p.id})`));
    }

    if (!plots || plots.length === 0) {
      console.log('   ⚠️  Aucune parcelle pour ce producteur');
      console.log('');
      continue;
    }

    const plotIds = plots.map(p => p.id);

    // 3. Trouver les opérations sur ces parcelles
    const { data: operations, error: opsError } = await supabase
      .from('operations')
      .select('id, operation_type, operation_date, plot_id, crop_id')
      .in('plot_id', plotIds);

    if (opsError) {
      console.error('❌ Erreur operations:', opsError);
    } else {
      console.log(`\n⚙️  Opérations: ${operations?.length || 0}`);
      if (operations && operations.length > 0) {
        operations.slice(0, 3).forEach(op => {
          console.log(`   - ${op.operation_type} le ${op.operation_date} (plot: ${op.plot_id})`);
        });
        if (operations.length > 3) {
          console.log(`   ... et ${operations.length - 3} autres`);
        }
      }
    }

    // 4. Trouver les observations sur ces parcelles
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('id, observation_type, observation_date, plot_id, crop_id')
      .in('plot_id', plotIds);

    if (obsError) {
      console.error('❌ Erreur observations:', obsError);
    } else {
      console.log(`\n🔍 Observations: ${observations?.length || 0}`);
      if (observations && observations.length > 0) {
        observations.slice(0, 3).forEach(obs => {
          console.log(`   - ${obs.observation_type} le ${obs.observation_date} (plot: ${obs.plot_id})`);
        });
        if (observations.length > 3) {
          console.log(`   ... et ${observations.length - 3} autres`);
        }
      }
    }

    console.log('');
  }

  console.log('═'.repeat(80));

  // 5. Tester les fonctions RPC
  console.log('\n\n🧪 Test des fonctions RPC\n');
  console.log('═'.repeat(80));

  const testProducer = producers[0];
  console.log(`\nTest avec producteur: ${testProducer.first_name} ${testProducer.last_name}\n`);

  // Test get_operations_with_details_v3
  const { data: rpcOps, error: rpcOpsError } = await supabase
    .rpc('get_operations_with_details_v3', {
      producer_uuid: testProducer.id,
      limit_count: 5,
      offset_count: 0,
      search_term: null,
      operation_type_filter: null
    });

  if (rpcOpsError) {
    console.error('❌ Erreur get_operations_with_details_v3:', rpcOpsError);
  } else {
    console.log(`✅ get_operations_with_details_v3: ${rpcOps?.length || 0} opération(s)`);
  }

  // Test get_observations_with_details_v3
  const { data: rpcObs, error: rpcObsError } = await supabase
    .rpc('get_observations_with_details_v3', {
      producer_uuid: testProducer.id,
      limit_count: 5,
      offset_count: 0,
      search_term: null,
      observation_type_filter: null
    });

  if (rpcObsError) {
    console.error('❌ Erreur get_observations_with_details_v3:', rpcObsError);
  } else {
    console.log(`✅ get_observations_with_details_v3: ${rpcObs?.length || 0} observation(s)`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 DIAGNOSTIC\n');
  console.log('─'.repeat(80));
  
  // Récapitulatif
  const { data: allOps } = await supabase.from('operations').select('id, plot_id');
  const { data: allObs } = await supabase.from('observations').select('id, plot_id');
  const { data: allPlots } = await supabase.from('plots').select('id, producer_id');
  
  console.log(`Total dans la base:`);
  console.log(`  • ${allOps?.length || 0} opérations`);
  console.log(`  • ${allObs?.length || 0} observations`);
  console.log(`  • ${allPlots?.length || 0} parcelles`);
  console.log(`  • ${producers.length} producteurs testés`);
  
  // Vérifier les opérations orphelines
  const opsWithPlots = allOps?.filter(op => op.plot_id !== null).length || 0;
  const obsWithPlots = allObs?.filter(obs => obs.plot_id !== null).length || 0;
  
  console.log(`\nLiaison plot_id:`);
  console.log(`  • ${opsWithPlots}/${allOps?.length || 0} opérations liées à une parcelle`);
  console.log(`  • ${obsWithPlots}/${allObs?.length || 0} observations liées à une parcelle`);
  
  if (opsWithPlots < (allOps?.length || 0)) {
    console.log(`  ⚠️  ${(allOps?.length || 0) - opsWithPlots} opérations ORPHELINES (plot_id NULL)`);
  }
  
  if (obsWithPlots < (allObs?.length || 0)) {
    console.log(`  ⚠️  ${(allObs?.length || 0) - obsWithPlots} observations ORPHELINES (plot_id NULL)`);
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n✅ Diagnostic terminé\n');
}

diagnose().catch(console.error);

