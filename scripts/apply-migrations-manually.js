#!/usr/bin/env node

/**
 * Script pour appliquer manuellement les migrations agent_assignments
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

console.log('🔧 APPLICATION MANUELLE DES MIGRATIONS');
console.log('======================================');
console.log('');

async function applyMigrations() {
  try {
    // 1. Vérifier si la table existe déjà
    console.log('1️⃣ VÉRIFICATION DE LA TABLE agent_assignments...');
    const { data: existingTable, error: checkError } = await supabase
      .from('agent_assignments')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Table agent_assignments existe déjà');
      console.log(`   ${existingTable.length} enregistrements trouvés`);
      return;
    }

    console.log('❌ Table agent_assignments n\'existe pas');
    console.log('   Application de la migration...');

    // 2. Créer la table via une requête SQL directe
    const createTableSQL = `
      CREATE TABLE public.agent_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        assigned_to_type TEXT NOT NULL CHECK (assigned_to_type IN ('producer', 'cooperative')),
        assigned_to_id UUID NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agent_id, assigned_to_type, assigned_to_id)
      );
    `;

    // Utiliser une approche différente - créer via une fonction RPC simple
    const { error: createError } = await supabase.rpc('sql', { 
      query: createTableSQL 
    });

    if (createError) {
      console.log('⚠️  Erreur lors de la création via RPC sql:', createError.message);
      
      // Essayer une approche alternative - utiliser l'interface Supabase directement
      console.log('   Tentative alternative...');
      
      // Test simple pour voir si on peut créer des données
      const { data: testData, error: testError } = await supabase
        .from('agent_assignments')
        .select('*')
        .limit(1);
        
      if (testError) {
        console.log('❌ Impossible d\'accéder à la table:', testError.message);
        console.log('');
        console.log('📋 ACTIONS MANUELLES REQUISES:');
        console.log('   1. Aller dans Supabase Studio');
        console.log('   2. Exécuter le SQL suivant dans l\'éditeur SQL:');
        console.log('');
        console.log(createTableSQL);
        console.log('');
        console.log('   3. Relancer ce script pour continuer');
        return;
      }
    }

    // 3. Vérifier la création
    const { data: verifyData, error: verifyError } = await supabase
      .from('agent_assignments')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('❌ Erreur de vérification:', verifyError.message);
      return;
    }

    console.log('✅ Table agent_assignments créée avec succès');

    // 4. Migrer les données existantes
    console.log('');
    console.log('2️⃣ MIGRATION DES DONNÉES EXISTANTES...');
    
    const { data: oldAssignments, error: oldError } = await supabase
      .from('agent_producer_assignments')
      .select('*');

    if (oldError) {
      console.log('⚠️  Table agent_producer_assignments non trouvée:', oldError.message);
    } else {
      console.log(`   📊 ${oldAssignments.length} assignations à migrer`);
      
      if (oldAssignments.length > 0) {
        // Migrer les données
        for (const assignment of oldAssignments) {
          const { error: insertError } = await supabase
            .from('agent_assignments')
            .insert({
              agent_id: assignment.agent_id,
              assigned_to_type: 'producer',
              assigned_to_id: assignment.producer_id,
              assigned_at: assignment.assigned_at,
              assigned_by: null // Pas d'information sur qui a assigné
            });

          if (insertError) {
            console.log(`   ⚠️  Erreur lors de la migration de l'assignation ${assignment.id}:`, insertError.message);
          }
        }
        
        console.log('✅ Migration des données terminée');
      }
    }

    // 5. Tester les fonctions RPC
    console.log('');
    console.log('3️⃣ TEST DES FONCTIONS RPC...');
    
    // Test de get_agent_assignments_stats
    const { data: stats, error: statsError } = await supabase.rpc('get_agent_assignments_stats');
    if (statsError) {
      console.log('   ⚠️  get_agent_assignments_stats non disponible:', statsError.message);
    } else {
      console.log('   ✅ get_agent_assignments_stats fonctionne');
    }

    // Test de get_agents_stats
    const { data: agentsStats, error: agentsStatsError } = await supabase.rpc('get_agents_stats');
    if (agentsStatsError) {
      console.log('   ⚠️  get_agents_stats non mise à jour:', agentsStatsError.message);
    } else {
      console.log('   ✅ get_agents_stats mise à jour');
    }

    console.log('');
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('');
    console.log('🎯 PROCHAINES ÉTAPES:');
    console.log('   1. Tester les fonctions RPC individuellement');
    console.log('   2. Mettre à jour le frontend (agentsService.ts)');
    console.log('   3. Tester l\'interface utilisateur');
    console.log('   4. Supprimer l\'ancienne table si tout fonctionne');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error.message);
  }
}

// Exécuter les migrations
applyMigrations().then(() => {
  console.log('');
  console.log('✅ Script terminé !');
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
