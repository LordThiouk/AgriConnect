#!/usr/bin/env node

/**
 * Script de Synchronisation - Tous les Rôles Utilisateur
 * Synchronise automatiquement tous les rôles entre profiles et user_metadata
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

async function syncAllUserRoles() {
  console.log('🔄 Synchronisation de tous les rôles utilisateur...\n');

  try {
    // 1. Vérifier la cohérence actuelle
    console.log('1️⃣ Vérification de la cohérence actuelle...');
    const { data: inconsistentCount, error: consistencyError } = await supabase
      .rpc('check_role_consistency');

    if (consistencyError) {
      console.error('❌ Erreur lors de la vérification:', consistencyError.message);
      return;
    }

    console.log(`   Utilisateurs incohérents: ${inconsistentCount}`);

    // Afficher le rapport détaillé
    const { data: consistencyReport, error: reportError } = await supabase
      .from('role_consistency_report')
      .select('*');

    if (!reportError && consistencyReport) {
      console.log(`   Total utilisateurs avec rôles: ${consistencyReport.length}`);
      
      const consistent = consistencyReport.filter(r => r.is_consistent);
      const inconsistent = consistencyReport.filter(r => !r.is_consistent);
      
      console.log(`   ✅ Cohérents: ${consistent.length}`);
      console.log(`   ❌ Incohérents: ${inconsistent.length}`);

      if (inconsistent.length > 0) {
        console.log('\n   Utilisateurs incohérents:');
        inconsistent.forEach(user => {
          console.log(`   - ${user.email}: profile=${user.profile_role}, metadata=${user.metadata_role}`);
        });
      }
    }

    // 2. Synchroniser tous les utilisateurs
    console.log('\n2️⃣ Synchronisation de tous les utilisateurs...');
    const { data: updatedCount, error: syncError } = await supabase
      .rpc('sync_all_user_roles');

    if (syncError) {
      console.error('❌ Erreur lors de la synchronisation:', syncError.message);
      return;
    }

    console.log(`   ${updatedCount} utilisateurs synchronisés`);

    // 3. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    const { data: finalInconsistentCount, error: finalError } = await supabase
      .rpc('check_role_consistency');

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError.message);
      return;
    }

    console.log(`   Utilisateurs incohérents restants: ${finalInconsistentCount}`);

    if (finalInconsistentCount === 0) {
      console.log('\n🎉 Tous les rôles sont maintenant synchronisés!');
    } else {
      console.log('\n⚠️  Certains utilisateurs restent incohérents.');
      console.log('   Exécutez "node scripts/sync-all-user-roles.js check" pour voir les détails.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
  }
}

async function checkConsistency() {
  console.log('🔍 Vérification de la cohérence des rôles...\n');

  try {
    const { data: report, error } = await supabase
      .from('role_consistency_report')
      .select('*');

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    console.log(`📊 Rapport de cohérence (${report.length} utilisateurs):\n`);

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

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'sync':
      await syncAllUserRoles();
      break;
    case 'check':
      await checkConsistency();
      break;
    default:
      console.log('Usage:');
      console.log('  node scripts/sync-all-user-roles.js sync    # Synchroniser tous les rôles');
      console.log('  node scripts/sync-all-user-roles.js check   # Vérifier la cohérence');
      console.log('');
      console.log('Exemples:');
      console.log('  node scripts/sync-all-user-roles.js sync');
      console.log('  node scripts/sync-all-user-roles.js check');
  }
}

main();
