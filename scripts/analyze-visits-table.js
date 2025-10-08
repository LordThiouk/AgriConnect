#!/usr/bin/env node

/**
 * Analyse de la table visits
 * Vérifie la structure et les données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeVisits() {
  console.log('🔍 Analyse de la table visits\n');
  console.log('═'.repeat(80));

  // 1. Récupérer la structure
  const { data: sample, error } = await supabase
    .from('visits')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`\n📊 ${sample?.length || 0} visites trouvées\n`);

  if (!sample || sample.length === 0) {
    console.log('⚠️  Aucune visite dans la table');
    
    // Vérifier le nombre total
    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total visites dans la base: ${count || 0}`);
    return;
  }

  // Afficher la structure
  console.log('📋 Structure de la table visits:\n');
  const visit = sample[0];
  const columns = Object.keys(visit);
  
  console.log('Colonnes disponibles:');
  columns.forEach((col, idx) => {
    const value = visit[col];
    const type = typeof value;
    console.log(`  ${idx + 1}. ${col} (${type}) = ${value === null ? 'NULL' : JSON.stringify(value)}`);
  });

  console.log('\n' + '═'.repeat(80));

  // Vérifier les colonnes de date
  console.log('\n🗓️  Vérification des colonnes de date:\n');
  
  const dateColumns = [
    'visit_date',
    'scheduled_date',
    'completed_at',
    'planned_date',
    'date',
    'created_at',
    'updated_at'
  ];
  
  dateColumns.forEach(col => {
    if (columns.includes(col)) {
      console.log(`  ✅ ${col} existe - Valeur: ${visit[col]}`);
    } else {
      console.log(`  ❌ ${col} n'existe PAS`);
    }
  });

  console.log('\n' + '═'.repeat(80));

  // Afficher quelques visites avec détails
  console.log('\n📍 Détails des visites:\n');
  
  for (const v of sample) {
    console.log('─'.repeat(80));
    console.log(`Visite ID: ${v.id}`);
    console.log(`  Plot ID: ${v.plot_id || 'NULL'}`);
    console.log(`  Producer ID: ${v.producer_id || 'NULL'}`);
    console.log(`  Agent ID: ${v.agent_id || 'NULL'}`);
    console.log(`  Status: ${v.status || 'NULL'}`);
    console.log(`  Created: ${v.created_at || 'NULL'}`);
    
    // Chercher toutes les colonnes qui ressemblent à des dates
    const possibleDateFields = Object.keys(v).filter(k => 
      k.includes('date') || k.includes('at') || k.includes('time')
    );
    
    if (possibleDateFields.length > 0) {
      console.log(`  Champs date possibles:`);
      possibleDateFields.forEach(field => {
        console.log(`    - ${field}: ${v[field]}`);
      });
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

analyzeVisits().catch(console.error);

