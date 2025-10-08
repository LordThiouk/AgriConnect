#!/usr/bin/env node

/**
 * Script d'analyse de la table observations
 * Vérifie les colonnes exactes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2ducWJ5bWJsbnlqY29jcXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODkzMDUsImV4cCI6MjA0NDA2NTMwNX0.1uYtxBHD2t7q2VbUyYpZ8j35ioUtMOgVcWx2vKRLOUw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeObservations() {
  console.log('🔍 Analyse de la table observations\n');
  console.log('═'.repeat(80));

  // 1. Récupérer une observation pour voir la structure
  const { data: sample, error } = await supabase
    .from('observations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  if (!sample || sample.length === 0) {
    console.log('⚠️  Aucune observation dans la table');
    return;
  }

  console.log('\n📊 Structure de la table observations:\n');
  
  const obs = sample[0];
  const columns = Object.keys(obs);
  
  console.log('Colonnes disponibles:');
  columns.forEach((col, idx) => {
    const value = obs[col];
    const type = typeof value;
    console.log(`  ${idx + 1}. ${col} (${type}) = ${value === null ? 'NULL' : JSON.stringify(value)}`);
  });

  console.log('\n' + '═'.repeat(80));
  
  // Vérifier les colonnes spécifiques
  console.log('\n🔍 Vérification des colonnes clés:\n');
  
  const keyColumns = [
    'observer_id',
    'observed_by',
    'performer_id',
    'agent_id',
    'plot_id',
    'crop_id'
  ];
  
  keyColumns.forEach(col => {
    if (columns.includes(col)) {
      console.log(`  ✅ ${col} existe`);
    } else {
      console.log(`  ❌ ${col} n'existe PAS`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

analyzeObservations().catch(console.error);

