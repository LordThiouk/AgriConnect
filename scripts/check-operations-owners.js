#!/usr/bin/env node

/**
 * Vérifier à quels producteurs appartiennent les opérations et observations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2ducWJ5bWJsbnlqY29jcXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODkzMDUsImV4cCI6MjA0NDA2NTMwNX0.1uYtxBHD2t7q2VbUyYpZ8j35ioUtMOgVcWx2vKRLOUw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOwners() {
  console.log('🔍 Vérification des propriétaires des opérations/observations\n');
  console.log('═'.repeat(80));

  // Récupérer opérations avec infos producteur
  const { data: ops, error: opsError } = await supabase
    .from('operations')
    .select(`
      id,
      operation_type,
      operation_date,
      plot_id,
      plots!inner (
        id,
        name_season_snapshot,
        producer_id,
        producers!inner (
          id,
          first_name,
          last_name
        )
      )
    `)
    .limit(10);

  if (opsError) {
    console.error('❌ Erreur operations:', opsError);
  } else {
    console.log(`\n⚙️  ${ops?.length || 0} OPÉRATIONS trouvées:\n`);
    
    if (ops && ops.length > 0) {
      ops.forEach(op => {
        const plot = Array.isArray(op.plots) ? op.plots[0] : op.plots;
        const producer = plot?.producers && (Array.isArray(plot.producers) ? plot.producers[0] : plot.producers);
        console.log(`  - ${op.operation_type} (${op.operation_date})`);
        console.log(`    Parcelle: ${plot?.name_season_snapshot}`);
        console.log(`    Producteur: ${producer?.first_name} ${producer?.last_name}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  Aucune opération trouvée avec plot/producteur');
    }
  }

  console.log('═'.repeat(80));

  // Récupérer observations avec infos producteur
  const { data: obs, error: obsError } = await supabase
    .from('observations')
    .select(`
      id,
      observation_type,
      observation_date,
      plot_id,
      plots!inner (
        id,
        name_season_snapshot,
        producer_id,
        producers!inner (
          id,
          first_name,
          last_name
        )
      )
    `)
    .limit(10);

  if (obsError) {
    console.error('❌ Erreur observations:', obsError);
  } else {
    console.log(`\n🔍 ${obs?.length || 0} OBSERVATIONS trouvées:\n`);
    
    if (obs && obs.length > 0) {
      obs.forEach(ob => {
        const plot = Array.isArray(ob.plots) ? ob.plots[0] : ob.plots;
        const producer = plot?.producers && (Array.isArray(plot.producers) ? plot.producers[0] : plot.producers);
        console.log(`  - ${ob.observation_type} (${ob.observation_date})`);
        console.log(`    Parcelle: ${plot?.name_season_snapshot}`);
        console.log(`    Producteur: ${producer?.first_name} ${producer?.last_name}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  Aucune observation trouvée avec plot/producteur');
    }
  }

  console.log('═'.repeat(80));
  console.log('\n✅ Vérification terminée\n');
}

checkOwners().catch(console.error);

