#!/usr/bin/env node

/**
 * Script pour vérifier la table profiles dans Supabase
 * Utilise la clé de service pour accéder aux données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\nVeuillez créer un fichier .env avec ces variables.');
  process.exit(1);
}

// Créer le client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfilesTable() {
  console.log('🔍 Vérification de la table profiles...\n');

  try {
    // Récupérer tous les profils
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des profils:', error);
      return;
    }

    console.log(`📊 Nombre total de profils: ${profiles.length}\n`);

    if (profiles.length === 0) {
      console.log('⚠️  Aucun profil trouvé dans la table profiles');
      return;
    }

    // Afficher les détails des profils
    console.log('👥 Détails des profils:');
    console.log('=' .repeat(80));
    
    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profil ID: ${profile.id}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Phone: ${profile.phone || 'N/A'}`);
      console.log(`   Role: ${profile.role || 'N/A'}`);
      console.log(`   Display Name: ${profile.display_name || 'N/A'}`);
      console.log(`   Region: ${profile.region || 'N/A'}`);
      console.log(`   Department: ${profile.department || 'N/A'}`);
      console.log(`   Commune: ${profile.commune || 'N/A'}`);
      console.log(`   Is Active: ${profile.is_active}`);
      console.log(`   Approval Status: ${profile.approval_status || 'N/A'}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log(`   Updated: ${profile.updated_at}`);
    });

    // Vérifier les agents spécifiquement
    const agents = profiles.filter(p => p.role === 'agent');
    console.log(`\n🤖 Nombre d'agents: ${agents.length}`);
    
    if (agents.length > 0) {
      console.log('\nAgents trouvés:');
      agents.forEach(agent => {
        console.log(`  - ${agent.id} (${agent.display_name || 'Sans nom'}) - ${agent.phone || 'Sans téléphone'}`);
      });
    }

    // Vérifier les assignations agent-producer
    console.log('\n🔗 Vérification des assignations agent-producer...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('agent_producer_assignments')
      .select(`
        *,
        profiles!agent_producer_assignments_agent_id_fkey(display_name, phone),
        producers!agent_producer_assignments_producer_id_fkey(first_name, last_name, phone)
      `);

    if (assignmentError) {
      console.error('❌ Erreur lors de la récupération des assignations:', assignmentError);
    } else {
      console.log(`📋 Nombre d'assignations: ${assignments.length}`);
      
      if (assignments.length > 0) {
        console.log('\nAssignations trouvées:');
        assignments.forEach(assignment => {
          const agent = assignment.profiles;
          const producer = assignment.producers;
          console.log(`  - Agent: ${agent?.display_name || 'N/A'} (${agent?.phone || 'N/A'})`);
          console.log(`    Producteur: ${producer?.first_name || 'N/A'} ${producer?.last_name || 'N/A'} (${producer?.phone || 'N/A'})`);
          console.log(`    Assigné le: ${assignment.assigned_at}`);
          console.log('');
        });
      }
    }

    // Vérifier les observations
    console.log('🔍 Vérification des observations...');
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('id, observation_type, observation_date, plot_id, crop_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (obsError) {
      console.error('❌ Erreur lors de la récupération des observations:', obsError);
    } else {
      console.log(`📝 Nombre d'observations (limité à 10): ${observations.length}`);
      
      if (observations.length > 0) {
        console.log('\nObservations récentes:');
        observations.forEach(obs => {
          console.log(`  - ${obs.id}: ${obs.observation_type} (${obs.observation_date}) - Plot: ${obs.plot_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
checkProfilesTable()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
