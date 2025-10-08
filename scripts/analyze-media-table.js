#!/usr/bin/env node

/**
 * Script d'analyse détaillée de la table media
 * Examine la structure, les contraintes et les relations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Charger les variables d'environnement
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

// Initialiser le client Supabase
function initSupabase() {
  const env = loadEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

// Analyser la structure de la table media
async function analyzeMediaTable() {
  log('\n🔍 Analyse Détaillée de la Table Media', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Vérifier l'existence de la table
    log('\n📋 Vérification existence table...', 'blue');
    
    const { data: tableExists, error: tableError } = await supabase
      .from('media')
      .select('*')
      .limit(1);

    if (tableError) {
      log(`❌ Erreur accès table media: ${tableError.message}`, 'red');
      log(`   Code: ${tableError.code}`, 'red');
      log(`   Details: ${tableError.details}`, 'red');
      return false;
    }

    log('✅ Table media accessible', 'green');

    // 2. Analyser les contraintes via les erreurs d'insertion
    log('\n🔧 Analyse des contraintes...', 'blue');
    
    // Test 1: Insertion sans owner_profile_id
    log('   Test 1: Insertion sans owner_profile_id...', 'blue');
    const { error: test1Error } = await supabase
      .from('media')
      .insert({
        entity_type: 'observation',
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        file_path: 'test/path/test.png',
        file_name: 'test.png',
        mime_type: 'image/png'
      });

    if (test1Error) {
      log(`   ❌ Contrainte owner_profile_id: ${test1Error.message}`, 'red');
    } else {
      log('   ⚠️  Pas de contrainte sur owner_profile_id', 'yellow');
    }

    // Test 2: Insertion avec owner_profile_id invalide
    log('   Test 2: Insertion avec owner_profile_id invalide...', 'blue');
    const { error: test2Error } = await supabase
      .from('media')
      .insert({
        owner_profile_id: 'invalid-uuid',
        entity_type: 'observation',
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        file_path: 'test/path/test.png',
        file_name: 'test.png',
        mime_type: 'image/png'
      });

    if (test2Error) {
      log(`   ❌ Contrainte UUID owner_profile_id: ${test2Error.message}`, 'red');
    }

    // Test 3: Insertion avec entity_id invalide
    log('   Test 3: Insertion avec entity_id invalide...', 'blue');
    const { error: test3Error } = await supabase
      .from('media')
      .insert({
        owner_profile_id: '550e8400-e29b-41d4-a716-446655440000',
        entity_type: 'observation',
        entity_id: 'invalid-uuid',
        file_path: 'test/path/test.png',
        file_name: 'test.png',
        mime_type: 'image/png'
      });

    if (test3Error) {
      log(`   ❌ Contrainte UUID entity_id: ${test3Error.message}`, 'red');
    }

    // 3. Vérifier les relations avec auth.users
    log('\n🔗 Vérification relations auth.users...', 'blue');
    
    // Récupérer un utilisateur de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      log(`❌ Erreur récupération auth.users: ${authError.message}`, 'red');
    } else if (authUsers && authUsers.users && authUsers.users.length > 0) {
      const testAuthUser = authUsers.users[0];
      log(`✅ Utilisateur auth trouvé: ${testAuthUser.id}`, 'green');
      
      // Test insertion avec auth.users.id
      log('   Test insertion avec auth.users.id...', 'blue');
      const { error: test4Error } = await supabase
        .from('media')
        .insert({
          owner_profile_id: testAuthUser.id,
          entity_type: 'observation',
          entity_id: '550e8400-e29b-41d4-a716-446655440000',
          file_path: 'test/path/test.png',
          file_name: 'test.png',
          mime_type: 'image/png'
        });

      if (test4Error) {
        log(`   ❌ Erreur avec auth.users.id: ${test4Error.message}`, 'red');
        log(`   Code: ${test4Error.code}`, 'red');
        log(`   Details: ${test4Error.details}`, 'red');
      } else {
        log('   ✅ Insertion réussie avec auth.users.id', 'green');
        
        // Nettoyer le test
        await supabase
          .from('media')
          .delete()
          .eq('file_path', 'test/path/test.png');
        log('   🗑️  Test nettoyé', 'yellow');
      }
    } else {
      log('❌ Aucun utilisateur auth trouvé', 'red');
    }

    // 4. Vérifier les relations avec profiles
    log('\n👥 Vérification relations profiles...', 'blue');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(1);

    if (profilesError) {
      log(`❌ Erreur récupération profiles: ${profilesError.message}`, 'red');
    } else if (profiles && profiles.length > 0) {
      const testProfile = profiles[0];
      log(`✅ Profil trouvé: ${testProfile.display_name} (${testProfile.id})`, 'green');
      
      // Test insertion avec profiles.id
      log('   Test insertion avec profiles.id...', 'blue');
      const { error: test5Error } = await supabase
        .from('media')
        .insert({
          owner_profile_id: testProfile.id,
          entity_type: 'observation',
          entity_id: '550e8400-e29b-41d4-a716-446655440000',
          file_path: 'test/path/test2.png',
          file_name: 'test2.png',
          mime_type: 'image/png'
        });

      if (test5Error) {
        log(`   ❌ Erreur avec profiles.id: ${test5Error.message}`, 'red');
        log(`   Code: ${test5Error.code}`, 'red');
        log(`   Details: ${test5Error.details}`, 'red');
      } else {
        log('   ✅ Insertion réussie avec profiles.id', 'green');
        
        // Nettoyer le test
        await supabase
          .from('media')
          .delete()
          .eq('file_path', 'test/path/test2.png');
        log('   🗑️  Test nettoyé', 'yellow');
      }
    } else {
      log('❌ Aucun profil trouvé', 'red');
    }

    // 5. Vérifier les types d'entités supportés
    log('\n📝 Vérification types d\'entités...', 'blue');
    
    const entityTypes = ['plot', 'crop', 'operation', 'observation', 'producer'];
    
    for (const entityType of entityTypes) {
      log(`   Test type: ${entityType}...`, 'blue');
      
      const { error: testError } = await supabase
        .from('media')
        .insert({
          owner_profile_id: '550e8400-e29b-41d4-a716-446655440000',
          entity_type: entityType,
          entity_id: '550e8400-e29b-41d4-a716-446655440000',
          file_path: `test/path/test_${entityType}.png`,
          file_name: `test_${entityType}.png`,
          mime_type: 'image/png'
        });

      if (testError) {
        log(`   ❌ Type ${entityType} non supporté: ${testError.message}`, 'red');
      } else {
        log(`   ✅ Type ${entityType} supporté`, 'green');
        
        // Nettoyer
        await supabase
          .from('media')
          .delete()
          .eq('file_path', `test/path/test_${entityType}.png`);
      }
    }

    // 6. Vérifier les colonnes requises
    log('\n📊 Vérification colonnes requises...', 'blue');
    
    const requiredFields = [
      'owner_profile_id',
      'entity_type', 
      'entity_id',
      'file_path',
      'file_name',
      'mime_type'
    ];

    for (const field of requiredFields) {
      log(`   Test sans ${field}...`, 'blue');
      
      const testData = {
        owner_profile_id: '550e8400-e29b-41d4-a716-446655440000',
        entity_type: 'observation',
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        file_path: 'test/path/test.png',
        file_name: 'test.png',
        mime_type: 'image/png'
      };
      
      delete testData[field];
      
      const { error: testError } = await supabase
        .from('media')
        .insert(testData);

      if (testError) {
        log(`   ❌ ${field} requis: ${testError.message}`, 'red');
      } else {
        log(`   ⚠️  ${field} non requis`, 'yellow');
      }
    }

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Analyse Table Media', 'bright');
  log('='.repeat(60), 'bright');

  const success = await analyzeMediaTable();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Analyse terminée!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs détectées lors de l\'analyse.', 'red');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erreur fatale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { analyzeMediaTable };
