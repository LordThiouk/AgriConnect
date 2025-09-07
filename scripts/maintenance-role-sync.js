#!/usr/bin/env node

/**
 * Script de Maintenance - Synchronisation des Rôles
 * Script de maintenance automatique pour maintenir la cohérence des rôles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMaintenance() {
  console.log('🔧 Maintenance de la synchronisation des rôles...\n');

  try {
    // 1. Vérifier la cohérence
    console.log('1️⃣ Vérification de la cohérence...');
    const { data: inconsistentCount, error: checkError } = await supabase
      .rpc('check_role_consistency');

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError.message);
      return false;
    }

    console.log(`   Utilisateurs incohérents: ${inconsistentCount}`);

    if (inconsistentCount === 0) {
      console.log('✅ Tous les rôles sont cohérents. Aucune action nécessaire.');
      return true;
    }

    // 2. Synchroniser si nécessaire
    console.log('\n2️⃣ Synchronisation des rôles incohérents...');
    const { data: updatedCount, error: syncError } = await supabase
      .rpc('sync_all_user_roles');

    if (syncError) {
      console.error('❌ Erreur lors de la synchronisation:', syncError.message);
      return false;
    }

    console.log(`   ${updatedCount} utilisateurs synchronisés`);

    // 3. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    const { data: finalInconsistentCount, error: finalError } = await supabase
      .rpc('check_role_consistency');

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError.message);
      return false;
    }

    if (finalInconsistentCount === 0) {
      console.log('✅ Maintenance terminée avec succès!');
      return true;
    } else {
      console.log(`⚠️  ${finalInconsistentCount} utilisateurs restent incohérents.`);
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors de la maintenance:', error.message);
    return false;
  }
}

async function generateReport() {
  console.log('📊 Génération du rapport de cohérence...\n');

  try {
    const { data: report, error } = await supabase
      .from('role_consistency_report')
      .select('*');

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    console.log(`📈 Rapport de cohérence (${report.length} utilisateurs):\n`);

    const statusCounts = {};
    report.forEach(user => {
      statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n📋 Détails par utilisateur:');
    report.forEach(user => {
      console.log(`   ${user.status} ${user.email}: profile=${user.profile_role || 'null'}, metadata=${user.metadata_role || 'null'}`);
    });

    // Statistiques par rôle
    console.log('\n📊 Répartition par rôle:');
    const roleCounts = {};
    report.forEach(user => {
      const role = user.profile_role || 'non défini';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'maintenance';

  switch (command) {
    case 'maintenance':
      const success = await runMaintenance();
      process.exit(success ? 0 : 1);
      break;
    case 'report':
      await generateReport();
      break;
    case 'check':
      const { data: count, error } = await supabase.rpc('check_role_consistency');
      if (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
      }
      console.log(`Utilisateurs incohérents: ${count}`);
      process.exit(count > 0 ? 1 : 0);
      break;
    default:
      console.log('Usage:');
      console.log('  node scripts/maintenance-role-sync.js maintenance  # Exécuter la maintenance');
      console.log('  node scripts/maintenance-role-sync.js report      # Générer un rapport');
      console.log('  node scripts/maintenance-role-sync.js check       # Vérifier rapidement (exit code)');
      console.log('');
      console.log('Exemples:');
      console.log('  node scripts/maintenance-role-sync.js maintenance');
      console.log('  node scripts/maintenance-role-sync.js report');
      console.log('  node scripts/maintenance-role-sync.js check');
  }
}

main();
