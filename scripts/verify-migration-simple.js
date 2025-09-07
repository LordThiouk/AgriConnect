#!/usr/bin/env node

/**
 * Script de vérification simple de la migration auth_logs
 * Utilise les informations de connexion Supabase directement
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (remplacez par vos vraies clés)
const SUPABASE_URL = 'https://swggnqbymblnyjcocqxi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Remplacez par votre vraie clé

async function verifyMigration() {
  console.log('🔍 Vérification de la migration auth_logs...');
  console.log('='.repeat(50));

  if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.log('⚠️  Veuillez remplacer SUPABASE_SERVICE_ROLE_KEY par votre vraie clé dans le script');
    console.log('   Vous pouvez la trouver dans: https://supabase.com/dashboard/project/swggnqbymblnyjcocqxi/settings/api');
    return false;
  }

  try {
    // Créer le client Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Vérifier que la table auth_logs existe
    console.log('1️⃣ Vérification de la table auth_logs...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .eq('table_name', 'auth_logs');

    if (tableError) {
      console.error('❌ Erreur lors de la vérification des tables:', tableError);
      return false;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Table auth_logs trouvée dans le schéma public');
    } else {
      console.log('❌ Table auth_logs non trouvée');
      return false;
    }

    // 2. Vérifier les fonctions créées
    console.log('\n2️⃣ Vérification des fonctions...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['log_auth_event', 'get_auth_log_stats', 'cleanup_old_auth_logs']);

    if (funcError) {
      console.error('❌ Erreur lors de la vérification des fonctions:', funcError);
    } else if (functions && functions.length > 0) {
      console.log('✅ Fonctions trouvées:');
      functions.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('❌ Aucune fonction trouvée');
    }

    // 3. Vérifier les vues créées
    console.log('\n3️⃣ Vérification des vues...');
    const { data: views, error: viewError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['auth_logs_summary', 'security_alerts']);

    if (viewError) {
      console.error('❌ Erreur lors de la vérification des vues:', viewError);
    } else if (views && views.length > 0) {
      console.log('✅ Vues trouvées:');
      views.forEach(view => {
        console.log(`   - ${view.table_name}`);
      });
    } else {
      console.log('❌ Aucune vue trouvée');
    }

    // 4. Tester la fonction log_auth_event
    console.log('\n4️⃣ Test de la fonction log_auth_event...');
    try {
      const { data: testResult, error: testError } = await supabase
        .rpc('log_auth_event', {
          p_user_id: null,
          p_event_type: 'test_event',
          p_platform: 'web',
          p_auth_method: 'email_password',
          p_user_role: 'admin',
          p_success: true,
          p_ip_address: '127.0.0.1',
          p_user_agent: 'test-agent',
          p_error_message: null,
          p_metadata: { test: true }
        });

      if (testError) {
        console.error('❌ Erreur lors du test de log_auth_event:', testError);
      } else {
        console.log('✅ Fonction log_auth_event testée avec succès');
        console.log(`   ID du log créé: ${testResult}`);
      }
    } catch (err) {
      console.error('❌ Erreur lors du test de log_auth_event:', err.message);
    }

    console.log('\n🎉 Vérification terminée!');
    return true;

  } catch (error) {
    console.error('❌ Erreur fatale lors de la vérification:');
    console.error(error);
    return false;
  }
}

// Exécuter la vérification
if (require.main === module) {
  verifyMigration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyMigration };
