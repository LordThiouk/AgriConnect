#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la table producers
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VÉRIFICATION DE LA STRUCTURE DE LA TABLE PRODUCERS');
console.log('====================================================');
console.log('');

async function checkProducersSchema() {
  try {
    // 1. Vérifier la structure de la table producers
    console.log('1️⃣ STRUCTURE DE LA TABLE PRODUCERS...');
    
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('*')
      .limit(1);

    if (producersError) {
      console.log('❌ Erreur lors de la lecture de producers:', producersError.message);
      return;
    }

    if (producers && producers.length > 0) {
      console.log('✅ Colonnes trouvées dans la table producers:');
      Object.keys(producers[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof producers[0][column]}`);
      });
    } else {
      console.log('⚠️  Table producers vide');
    }

    // 2. Vérifier la structure de la table profiles
    console.log('');
    console.log('2️⃣ STRUCTURE DE LA TABLE PROFILES...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Erreur lors de la lecture de profiles:', profilesError.message);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ Colonnes trouvées dans la table profiles:');
      Object.keys(profiles[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof profiles[0][column]}`);
      });
    } else {
      console.log('⚠️  Table profiles vide');
    }

    // 3. Vérifier la structure de la table cooperatives
    console.log('');
    console.log('3️⃣ STRUCTURE DE LA TABLE COOPERATIVES...');
    
    const { data: cooperatives, error: cooperativesError } = await supabase
      .from('cooperatives')
      .select('*')
      .limit(1);

    if (cooperativesError) {
      console.log('❌ Erreur lors de la lecture de cooperatives:', cooperativesError.message);
      return;
    }

    if (cooperatives && cooperatives.length > 0) {
      console.log('✅ Colonnes trouvées dans la table cooperatives:');
      Object.keys(cooperatives[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof cooperatives[0][column]}`);
      });
    } else {
      console.log('⚠️  Table cooperatives vide');
    }

    console.log('');
    console.log('📋 CORRECTION NÉCESSAIRE DANS LA MIGRATION:');
    console.log('   - Utiliser le bon nom de colonne pour le nom du producteur');
    console.log('   - Vérifier les noms de colonnes dans la vue agent_assignments_with_details');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter la vérification
checkProducersSchema().then(() => {
  console.log('');
  console.log('✅ Vérification terminée !');
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
