/**
 * Script pour migrer tous les imports de types vers lib/types/core/
 */

const fs = require('fs');
const path = require('path');

// Patterns d'imports à remplacer
const importReplacements = [
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/types\//g,
    replacement: "from '../../../lib/types/core/"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/types\//g,
    replacement: "from '../../lib/types/core/"
  },
  {
    pattern: /from ['"]\.\.\/types\//g,
    replacement: "from '../lib/types/core/"
  },
  {
    pattern: /from ['"]types\//g,
    replacement: "from 'lib/types/core/"
  }
];

// Fichiers à traiter (exclure les scripts et docs)
const filesToProcess = [
  'mobile/lib/services/domain',
  'mobile/lib/services/core',
  'mobile/lib/hooks',
  'mobile/lib/auth',
  'mobile/lib/supabase.ts',
  'mobile/components',
  'mobile/app',
  'mobile/context'
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Appliquer tous les remplacements
    importReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migré: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  Aucun changement: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erreur ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Dossier non trouvé: ${dirPath}`);
    return;
  }
  
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignorer node_modules et autres dossiers système
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  });
}

console.log('🔄 Migration des imports de types vers lib/types/core/...\n');

let totalFiles = 0;
let modifiedFiles = 0;

filesToProcess.forEach(dir => {
  console.log(`📁 Traitement de: ${dir}`);
  processDirectory(dir);
});

console.log('\n✅ Migration terminée !');
