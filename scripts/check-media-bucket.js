#!/usr/bin/env node

/**
 * Script de vérification du bucket media Supabase
 * Vérifie le contenu et la structure du bucket media
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
    log('   SUPABASE_URL et SUPABASE_ROLE_KEY sont requis', 'yellow');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Vérifier le bucket media
async function checkMediaBucket() {
  log('\n📸 Vérification du bucket media Supabase', 'cyan');
  log('='.repeat(60), 'cyan');

  const supabase = initSupabase();

  try {
    // 1. Lister tous les fichiers du bucket
    log('\n📁 Contenu du bucket media:', 'blue');
    
    const { data: files, error: listError } = await supabase.storage
      .from('media')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      log(`❌ Erreur lors de la récupération des fichiers: ${listError.message}`, 'red');
      return false;
    }

    if (!files || files.length === 0) {
      log('⚠️  Aucun fichier trouvé dans le bucket media', 'yellow');
      return true;
    }

    log(`✅ ${files.length} fichiers trouvés dans le bucket`, 'green');

    // 2. Analyser la structure des fichiers
    log('\n📊 Analyse de la structure:', 'blue');
    
    const fileStats = {
      total: files.length,
      byType: {},
      byFolder: {},
      totalSize: 0,
      recentFiles: 0
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    files.forEach(file => {
      // Analyser par type de fichier
      const extension = path.extname(file.name).toLowerCase();
      fileStats.byType[extension] = (fileStats.byType[extension] || 0) + 1;

      // Analyser par dossier (première partie du path)
      const folder = file.name.split('/')[0];
      fileStats.byFolder[folder] = (fileStats.byFolder[folder] || 0) + 1;

      // Taille totale
      if (file.metadata && file.metadata.size) {
        fileStats.totalSize += file.metadata.size;
      }

      // Fichiers récents
      if (file.created_at && new Date(file.created_at) > oneWeekAgo) {
        fileStats.recentFiles++;
      }
    });

    // Afficher les statistiques
    log(`   📁 Total fichiers: ${fileStats.total}`, 'green');
    log(`   📏 Taille totale: ${(fileStats.totalSize / 1024 / 1024).toFixed(2)} MB`, 'green');
    log(`   🆕 Fichiers récents (7j): ${fileStats.recentFiles}`, 'green');

    // Types de fichiers
    log('\n📄 Types de fichiers:', 'blue');
    Object.entries(fileStats.byType)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const icon = getFileIcon(type);
        log(`   ${icon} ${type || 'sans extension'}: ${count}`, 'green');
      });

    // Structure des dossiers
    log('\n📂 Structure des dossiers:', 'blue');
    Object.entries(fileStats.byFolder)
      .sort(([,a], [,b]) => b - a)
      .forEach(([folder, count]) => {
        log(`   📁 ${folder}/: ${count} fichiers`, 'green');
      });

    // 3. Vérifier les permissions RLS
    log('\n🔒 Vérification des permissions:', 'blue');
    
    try {
      // Tester l'accès en lecture
      const { data: testData, error: testError } = await supabase.storage
        .from('media')
        .list('', { limit: 1 });

      if (testError) {
        log(`   ❌ Erreur d'accès: ${testError.message}`, 'red');
      } else {
        log('   ✅ Accès en lecture autorisé', 'green');
      }
    } catch (error) {
      log(`   ❌ Erreur de permission: ${error.message}`, 'red');
    }

    // 4. Vérifier les fichiers récents
    log('\n🆕 Fichiers récents (derniers 10):', 'blue');
    
    const recentFiles = files
      .filter(f => f.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    recentFiles.forEach((file, index) => {
      const date = new Date(file.created_at).toLocaleString('fr-FR');
      const size = file.metadata?.size ? `(${(file.metadata.size / 1024).toFixed(1)} KB)` : '';
      const icon = getFileIcon(path.extname(file.name));
      log(`   ${index + 1}. ${icon} ${file.name} - ${date} ${size}`, 'green');
    });

    // 5. Vérifier la table media en base
    log('\n🗄️  Vérification de la table media:', 'blue');
    
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('media')
      .select('id, entity_type, entity_id, file_path, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (mediaError) {
      log(`   ❌ Erreur table media: ${mediaError.message}`, 'red');
    } else {
      log(`   ✅ ${mediaRecords?.length || 0} enregistrements dans la table media`, 'green');
      
      if (mediaRecords && mediaRecords.length > 0) {
        log('\n📋 Derniers enregistrements media:', 'blue');
        mediaRecords.forEach((record, index) => {
          const date = new Date(record.created_at).toLocaleString('fr-FR');
          log(`   ${index + 1}. ${record.entity_type}/${record.entity_id} - ${record.file_path} (${date})`, 'green');
        });
      }
    }

    // 6. Vérifier la cohérence Storage vs Database
    log('\n🔍 Vérification de cohérence Storage vs Database:', 'blue');
    
    if (mediaRecords && mediaRecords.length > 0) {
      const dbPaths = new Set(mediaRecords.map(r => r.file_path));
      const storagePaths = new Set(files.map(f => f.name));
      
      const inDbNotInStorage = [...dbPaths].filter(path => !storagePaths.has(path));
      const inStorageNotInDb = [...storagePaths].filter(path => !dbPaths.has(path));
      
      if (inDbNotInStorage.length > 0) {
        log(`   ⚠️  ${inDbNotInStorage.length} fichiers en DB mais pas en Storage`, 'yellow');
        inDbNotInStorage.slice(0, 5).forEach(path => {
          log(`      - ${path}`, 'yellow');
        });
      }
      
      if (inStorageNotInDb.length > 0) {
        log(`   ⚠️  ${inStorageNotInDb.length} fichiers en Storage mais pas en DB`, 'yellow');
        inStorageNotInDb.slice(0, 5).forEach(path => {
          log(`      - ${path}`, 'yellow');
        });
      }
      
      if (inDbNotInStorage.length === 0 && inStorageNotInDb.length === 0) {
        log('   ✅ Cohérence parfaite entre Storage et Database', 'green');
      }
    }

    return true;

  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    return false;
  }
}

// Obtenir l'icône selon le type de fichier
function getFileIcon(extension) {
  const icons = {
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.webp': '🖼️',
    '.mp4': '🎥',
    '.avi': '🎥',
    '.mov': '🎥',
    '.pdf': '📄',
    '.doc': '📄',
    '.docx': '📄',
    '.txt': '📄',
    '.zip': '📦',
    '.rar': '📦',
    '': '📄'
  };
  
  return icons[extension] || '📄';
}

// Fonction principale
async function main() {
  log('🚀 AgriConnect - Vérification du Bucket Media', 'bright');
  log('='.repeat(60), 'bright');

  const success = await checkMediaBucket();

  log('\n' + '='.repeat(60), 'bright');
  
  if (success) {
    log('🎉 Vérification du bucket media terminée!', 'green');
    process.exit(0);
  } else {
    log('❌ Erreurs détectées lors de la vérification.', 'red');
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

module.exports = { checkMediaBucket };
