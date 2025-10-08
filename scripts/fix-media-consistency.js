#!/usr/bin/env node

/**
 * Script de correction de cohérence Storage vs Database
 * Analyse et corrige les incohérences entre Supabase Storage et la table media
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
  
  if (!fs.existsSync(envPath)) {
    log('❌ Fichier .env non trouvé', 'red');
    process.exit(1);
  }

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

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Variables Supabase manquantes dans .env', 'red');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Analyser la cohérence
async function analyzeConsistency() {
  log('\n🔍 Analyse de cohérence Storage vs Database', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Récupérer tous les fichiers du Storage
    log('\n📁 Récupération des fichiers Storage...', 'blue');
    
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('media')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      log(`❌ Erreur Storage: ${storageError.message}`, 'red');
      return false;
    }

    // 2. Récupérer tous les enregistrements de la table media
    log('🗄️  Récupération des enregistrements Database...', 'blue');
    
    const { data: dbRecords, error: dbError } = await supabase
      .from('media')
      .select('id, entity_type, entity_id, file_path, file_name, created_at')
      .order('created_at', { ascending: false });

    if (dbError) {
      log(`❌ Erreur Database: ${dbError.message}`, 'red');
      return false;
    }

    log(`✅ ${storageFiles?.length || 0} fichiers en Storage`, 'green');
    log(`✅ ${dbRecords?.length || 0} enregistrements en Database`, 'green');

    // 3. Analyser les incohérences
    log('\n🔍 Analyse des incohérences...', 'blue');

    const storagePaths = new Set();
    const dbPaths = new Set();
    const dbFileNames = new Set();

    // Collecter les chemins Storage
    if (storageFiles) {
      storageFiles.forEach(file => {
        if (file.name && !file.name.endsWith('/')) {
          storagePaths.add(file.name);
        }
      });
    }

    // Collecter les chemins et noms Database
    if (dbRecords) {
      dbRecords.forEach(record => {
        if (record.file_path) {
          dbPaths.add(record.file_path);
        }
        if (record.file_name) {
          dbFileNames.add(record.file_name);
        }
      });
    }

    // Identifier les incohérences
    const inDbNotInStorage = [...dbPaths].filter(path => !storagePaths.has(path));
    const inStorageNotInDb = [...storagePaths].filter(path => !dbPaths.has(path));

    log(`\n📊 Résultats de l'analyse:`, 'magenta');
    log(`   📁 Fichiers en Storage: ${storagePaths.size}`, 'green');
    log(`   🗄️  Enregistrements en DB: ${dbPaths.size}`, 'green');
    log(`   ❌ En DB mais pas en Storage: ${inDbNotInStorage.length}`, 'red');
    log(`   ❌ En Storage mais pas en DB: ${inStorageNotInDb.length}`, 'red');

    // 4. Détails des incohérences
    if (inDbNotInStorage.length > 0) {
      log('\n❌ Fichiers en Database mais absents du Storage:', 'red');
      inDbNotInStorage.slice(0, 10).forEach((filePath, index) => {
        log(`   ${index + 1}. ${filePath}`, 'red');
      });
      if (inDbNotInStorage.length > 10) {
        log(`   ... et ${inDbNotInStorage.length - 10} autres`, 'red');
      }
    }

    if (inStorageNotInDb.length > 0) {
      log('\n❌ Fichiers en Storage mais absents de la Database:', 'red');
      inStorageNotInDb.slice(0, 10).forEach((filePath, index) => {
        log(`   ${index + 1}. ${filePath}`, 'red');
      });
      if (inStorageNotInDb.length > 10) {
        log(`   ... et ${inStorageNotInDb.length - 10} autres`, 'red');
      }
    }

    // 5. Analyser les patterns de noms
    log('\n🔍 Analyse des patterns de noms:', 'blue');
    
    const storagePatterns = analyzeFilePatterns([...storagePaths]);
    const dbPatterns = analyzeFilePatterns([...dbPaths]);

    log('   Patterns Storage:', 'green');
    Object.entries(storagePatterns).forEach(([pattern, count]) => {
      log(`     ${pattern}: ${count}`, 'green');
    });

    log('   Patterns Database:', 'green');
    Object.entries(dbPatterns).forEach(([pattern, count]) => {
      log(`     ${pattern}: ${count}`, 'green');
    });

    // 6. Suggestions de correction
    log('\n💡 Suggestions de correction:', 'cyan');
    
    if (inDbNotInStorage.length > 0) {
      log('   1. Nettoyer les enregistrements orphelins en Database', 'yellow');
      log('   2. Vérifier la logique d\'upload des fichiers', 'yellow');
    }
    
    if (inStorageNotInDb.length > 0) {
      log('   3. Créer les enregistrements manquants en Database', 'yellow');
      log('   4. Ou supprimer les fichiers orphelins du Storage', 'yellow');
    }

    // 7. Proposer des actions de correction
    log('\n🛠️  Actions de correction disponibles:', 'blue');
    log('   [1] Nettoyer les enregistrements orphelins en DB', 'green');
    log('   [2] Créer les enregistrements manquants en DB', 'green');
    log('   [3] Supprimer les fichiers orphelins du Storage', 'red');
    log('   [4] Afficher un rapport détaillé', 'blue');

    return {
      storageFiles,
      dbRecords,
      inDbNotInStorage,
      inStorageNotInDb,
      storagePatterns,
      dbPatterns
    };

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Analyser les patterns de noms de fichiers
function analyzeFilePatterns(filePaths) {
  const patterns = {};
  
  filePaths.forEach(filePath => {
    const parts = filePath.split('/');
    
    if (parts.length >= 2) {
      const pattern = `${parts[0]}/${parts[1]}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    } else {
      patterns['root'] = (patterns['root'] || 0) + 1;
    }
  });
  
  return patterns;
}

// Nettoyer les enregistrements orphelins
async function cleanOrphanedRecords() {
  log('\n🧹 Nettoyage des enregistrements orphelins...', 'cyan');
  
  const supabase = initSupabase();
  
  try {
    // Récupérer tous les fichiers Storage
    const { data: storageFiles } = await supabase.storage
      .from('media')
      .list('', { limit: 1000 });
    
    const storagePaths = new Set();
    if (storageFiles) {
      storageFiles.forEach(file => {
        if (file.name && !file.name.endsWith('/')) {
          storagePaths.add(file.name);
        }
      });
    }

    // Récupérer tous les enregistrements DB
    const { data: dbRecords } = await supabase
      .from('media')
      .select('id, file_path');

    if (!dbRecords) {
      log('❌ Aucun enregistrement trouvé en Database', 'red');
      return false;
    }

    // Identifier les orphelins
    const orphanedIds = dbRecords
      .filter(record => !storagePaths.has(record.file_path))
      .map(record => record.id);

    if (orphanedIds.length === 0) {
      log('✅ Aucun enregistrement orphelin trouvé', 'green');
      return true;
    }

    log(`🗑️  Suppression de ${orphanedIds.length} enregistrements orphelins...`, 'yellow');

    // Supprimer les enregistrements orphelins
    const { error } = await supabase
      .from('media')
      .delete()
      .in('id', orphanedIds);

    if (error) {
      log(`❌ Erreur lors de la suppression: ${error.message}`, 'red');
      return false;
    }

    log(`✅ ${orphanedIds.length} enregistrements orphelins supprimés`, 'green');
    return true;

  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Correction de Cohérence Media', 'bright');
  log('='.repeat(60), 'bright');

  const analysis = await analyzeConsistency();
  
  if (!analysis) {
    log('❌ Échec de l\'analyse', 'red');
    process.exit(1);
  }

  // Proposer des actions
  log('\n' + '='.repeat(60), 'bright');
  log('🎯 Analyse terminée. Utilisez les scripts suivants pour corriger:', 'cyan');
  log('   node scripts/fix-media-consistency.js --clean-db', 'green');
  log('   node scripts/fix-media-consistency.js --create-db', 'green');
  log('   node scripts/fix-media-consistency.js --clean-storage', 'red');
  log('   node scripts/fix-media-consistency.js --report', 'blue');
}

// Gestion des arguments de ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean-db')) {
    cleanOrphanedRecords().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else if (args.includes('--report')) {
    analyzeConsistency().then(() => {
      process.exit(0);
    });
  } else {
    main().catch(error => {
      log(`❌ Erreur fatale: ${error.message}`, 'red');
      process.exit(1);
    });
  }
}

module.exports = { analyzeConsistency, cleanOrphanedRecords };
