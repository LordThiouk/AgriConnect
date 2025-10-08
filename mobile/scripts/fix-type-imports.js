/**
 * Script simple pour corriger les imports de types
 */

const fs = require('fs');
const path = require('path');

// Fonction pour traiter un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer les patterns d'imports
    const patterns = [
      { from: /from ['"]\.\.\/\.\.\/\.\.\/types\//g, to: "from '../../../lib/types/core/" },
      { from: /from ['"]\.\.\/\.\.\/types\//g, to: "from '../../lib/types/core/" },
      { from: /from ['"]\.\.\/types\//g, to: "from '../lib/types/core/" },
      { from: /from ['"]types\//g, to: "from 'lib/types/core/" }
    ];
    
    patterns.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement
function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
      walkDir(filePath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      fixFile(filePath);
    }
  });
}

console.log('🔄 Correction des imports de types...\n');

// Traiter les dossiers principaux
const dirs = [
  'lib/services/domain',
  'lib/services/core', 
  'lib/hooks',
  'lib/auth',
  'components',
  'app',
  'context'
];

dirs.forEach(dir => {
  console.log(`📁 Traitement: ${dir}`);
  walkDir(dir);
});

// Traiter les fichiers à la racine de lib
const rootFiles = ['lib/supabase.ts'];
rootFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fixFile(file);
  }
});

console.log('\n✅ Correction terminée !');
