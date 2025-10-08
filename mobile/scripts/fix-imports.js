/**
 * Script pour corriger tous les imports cassés
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Fonctions de correction
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Corriger les imports vers lib/types/core
  const coreImportRegex = /from ['"]\.\.\/\.\.\/lib\/types\/core['"]/g;
  const coreImportReplacement = "from '../../lib/types/core'";
  if (content.match(coreImportRegex)) {
    content = content.replace(coreImportRegex, coreImportReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import lib/types/core dans ${path.basename(filePath)}`);
  }

  // 2. Corriger les imports vers lib/types/core/core
  const coreCoreImportRegex = /from ['"]\.\.\/\.\.\/lib\/types\/core\/core['"]/g;
  const coreCoreImportReplacement = "from '../../lib/types/core'";
  if (content.match(coreCoreImportRegex)) {
    content = content.replace(coreCoreImportRegex, coreCoreImportReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import lib/types/core/core dans ${path.basename(filePath)}`);
  }

  // 3. Corriger les imports vers lib/types/core/cache
  const cacheImportRegex = /from ['"]\.\.\/\.\.\/lib\/types\/core\/cache['"]/g;
  const cacheImportReplacement = "from '../../lib/types/core'";
  if (content.match(cacheImportRegex)) {
    content = content.replace(cacheImportRegex, cacheImportReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import lib/types/core/cache dans ${path.basename(filePath)}`);
  }

  // 4. Corriger les imports vers supabase/client
  const supabaseImportRegex = /from ['"]\.\.\/\.\.\/supabase\/client['"]/g;
  const supabaseImportReplacement = "from '../../supabase/client'";
  if (content.match(supabaseImportRegex)) {
    content = content.replace(supabaseImportRegex, supabaseImportReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import supabase/client dans ${path.basename(filePath)}`);
  }

  // 5. Corriger les imports vers core/cache
  const coreCacheImportRegex = /from ['"]\.\.\/core\/cache['"]/g;
  const coreCacheImportReplacement = "from '../core/cache'";
  if (content.match(coreCacheImportRegex)) {
    content = content.replace(coreCacheImportRegex, coreCacheImportReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import core/cache dans ${path.basename(filePath)}`);
  }

  // 6. Corriger AgriConnectCache vers agriConnectCache
  const agriConnectCacheRegex = /AgriConnectCache/g;
  if (content.match(agriConnectCacheRegex)) {
    content = content.replace(agriConnectCacheRegex, 'agriConnectCache');
    modified = true;
    console.log(`  ✅ Corrigé AgriConnectCache vers agriConnectCache dans ${path.basename(filePath)}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Fonction pour parcourir récursivement les dossiers
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalFixed = 0;

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Parcourir récursivement
      totalFixed += processDirectory(itemPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      // Traiter les fichiers TypeScript
      console.log(`🔍 Vérification de ${itemPath.replace(projectRoot, '.')}`);
      
      if (fixImportsInFile(itemPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

// Exécution
console.log('🔧 === CORRECTION DES IMPORTS ===\n');

try {
  const totalFixed = processDirectory(projectRoot);
  
  console.log(`\n✅ Correction terminée !`);
  console.log(`📊 ${totalFixed} fichiers modifiés`);
  
  if (totalFixed === 0) {
    console.log('🎉 Tous les imports sont déjà corrects !');
  }
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error);
  process.exit(1);
}
