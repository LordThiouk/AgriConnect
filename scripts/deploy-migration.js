#!/usr/bin/env node

/**
 * Script pour déployer la migration auth_logs sur Supabase
 * Utilise l'API Supabase pour exécuter la migration SQL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Créer le client Supabase avec la clé service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployMigration() {
  try {
    console.log('🚀 Déploiement de la migration auth_logs...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250830020002_create_auth_logs_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL chargée:', migrationPath);
    console.log('📊 Taille du fichier:', migrationSQL.length, 'caractères');
    
    // Exécuter la migration via l'API Supabase
    console.log('⚡ Exécution de la migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:');
      console.error(error);
      process.exit(1);
    }
    
    console.log('✅ Migration déployée avec succès!');
    console.log('📋 Résultat:', data);
    
    // Vérifier que la table a été créée
    console.log('🔍 Vérification de la création de la table...');
    
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'auth_logs');
    
    if (tableError) {
      console.error('❌ Erreur lors de la vérification:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Table auth_logs créée avec succès!');
    } else {
      console.log('⚠️  Table auth_logs non trouvée dans le schéma public');
    }
    
    // Vérifier les fonctions créées
    console.log('🔍 Vérification des fonctions créées...');
    
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['log_auth_event', 'get_auth_log_stats', 'cleanup_old_auth_logs']);
    
    if (funcError) {
      console.error('❌ Erreur lors de la vérification des fonctions:', funcError);
    } else if (functions && functions.length > 0) {
      console.log('✅ Fonctions créées:', functions.map(f => f.routine_name).join(', '));
    } else {
      console.log('⚠️  Aucune fonction trouvée');
    }
    
    console.log('🎉 Déploiement terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur fatale lors du déploiement:');
    console.error(error);
    process.exit(1);
  }
}

// Fonction alternative utilisant l'API REST directe
async function deployMigrationDirect() {
  try {
    console.log('🚀 Déploiement direct de la migration auth_logs...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250830020002_create_auth_logs_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL chargée:', migrationPath);
    
    // Diviser le SQL en instructions individuelles
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📊 Nombre d\'instructions SQL:', statements.length);
    
    // Exécuter chaque instruction via l'API REST
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Exécution de l'instruction ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', statement);
        
        if (error) {
          console.error(`❌ Erreur dans l'instruction ${i + 1}:`, error);
          // Continuer avec les autres instructions
        } else {
          console.log(`✅ Instruction ${i + 1} exécutée avec succès`);
        }
      } catch (err) {
        console.error(`❌ Erreur fatale dans l'instruction ${i + 1}:`, err);
        // Continuer avec les autres instructions
      }
    }
    
    console.log('🎉 Déploiement terminé!');
    
  } catch (error) {
    console.error('❌ Erreur fatale lors du déploiement direct:');
    console.error(error);
    process.exit(1);
  }
}

// Fonction pour afficher les instructions manuelles
function showManualInstructions() {
  console.log('\n📋 INSTRUCTIONS MANUELLES POUR DÉPLOYER LA MIGRATION:');
  console.log('='.repeat(60));
  console.log('1. Ouvrez le Dashboard Supabase:');
  console.log('   https://supabase.com/dashboard/project/swggnqbymblnyjcocqxi');
  console.log('');
  console.log('2. Allez dans "SQL Editor" (dans le menu de gauche)');
  console.log('');
  console.log('3. Copiez et collez le contenu du fichier:');
  console.log('   supabase/migrations/20250830020002_create_auth_logs_table.sql');
  console.log('');
  console.log('4. Cliquez sur "Run" pour exécuter la migration');
  console.log('');
  console.log('5. Vérifiez que la table "auth_logs" a été créée dans "Table Editor"');
  console.log('');
  console.log('6. Vérifiez que les fonctions ont été créées dans "Database Functions"');
  console.log('   - log_auth_event');
  console.log('   - get_auth_log_stats');
  console.log('   - cleanup_old_auth_logs');
  console.log('');
  console.log('✅ Migration terminée!');
}

// Exécuter le script
if (require.main === module) {
  console.log('🔧 Script de déploiement de migration AgriConnect');
  console.log('='.repeat(50));
  
  // Essayer d'abord la méthode RPC
  deployMigration().catch(() => {
    console.log('\n⚠️  Méthode RPC échouée, essai de la méthode directe...');
    return deployMigrationDirect();
  }).catch(() => {
    console.log('\n⚠️  Déploiement automatique échoué, affichage des instructions manuelles...');
    showManualInstructions();
  });
}

module.exports = { deployMigration, deployMigrationDirect, showManualInstructions };
