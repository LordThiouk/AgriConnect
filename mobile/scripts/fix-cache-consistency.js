/**
 * Script pour corriger la cohérence du système de cache dans tous les services de domaine
 */

const fs = require('fs');
const path = require('path');

const domainServicesPath = path.join(__dirname, '../lib/services/domain');

// Fonctions de correction
function fixCacheFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Corriger { ttl: ... } vers ttl
  const ttlRegex = /agriConnectCache\.set\(([^,]+),\s*([^,]+),\s*\{\s*ttl:\s*([^}]+)\s*\}\)/g;
  const ttlReplacement = 'agriConnectCache.set($1, $2, $3)';
  if (content.match(ttlRegex)) {
    content = content.replace(ttlRegex, ttlReplacement);
    modified = true;
    console.log(`  ✅ Corrigé { ttl: ... } dans ${path.basename(filePath)}`);
  }

  // 2. Corriger invalidatePattern() vers invalidate({ pattern: ... })
  const invalidatePatternRegex = /agriConnectCache\.invalidatePattern\(['"`]([^'"`]+)['"`]\)/g;
  const invalidatePatternReplacement = 'agriConnectCache.invalidate({ pattern: \'$1\' })';
  if (content.match(invalidatePatternRegex)) {
    content = content.replace(invalidatePatternRegex, invalidatePatternReplacement);
    modified = true;
    console.log(`  ✅ Corrigé invalidatePattern() dans ${path.basename(filePath)}`);
  }

  // 3. Corriger invalidate(key) vers invalidate({ pattern: key })
  const invalidateKeyRegex = /agriConnectCache\.invalidate\(([^)]+)\)(?!\s*\{)/g;
  const invalidateKeyReplacement = 'agriConnectCache.invalidate({ pattern: $1 })';
  if (content.match(invalidateKeyRegex)) {
    content = content.replace(invalidateKeyRegex, invalidateKeyReplacement);
    modified = true;
    console.log(`  ✅ Corrigé invalidate(key) dans ${path.basename(filePath)}`);
  }

  // 4. Corriger les imports incorrects
  const importRegex = /from ['"]\.\.\/\.\.\/lib\/types\/core\/core['"]/g;
  const importReplacement = "from '../../lib/types/core'";
  if (content.match(importRegex)) {
    content = content.replace(importRegex, importReplacement);
    modified = true;
    console.log(`  ✅ Corrigé import core/core dans ${path.basename(filePath)}`);
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
    } else if (item.endsWith('.ts') && (item.includes('cache') || item.includes('service'))) {
      // Traiter les fichiers de cache et de service
      console.log(`🔍 Vérification de ${itemPath.replace(process.cwd(), '.')}`);
      
      if (fixCacheFile(itemPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

// Exécution
console.log('🔧 === CORRECTION DE LA COHÉRENCE DU CACHE ===\n');

try {
  const totalFixed = processDirectory(domainServicesPath);
  
  console.log(`\n✅ Correction terminée !`);
  console.log(`📊 ${totalFixed} fichiers modifiés`);
  
  if (totalFixed === 0) {
    console.log('🎉 Tous les fichiers sont déjà cohérents avec le système de cache !');
  }
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error);
  process.exit(1);
}
