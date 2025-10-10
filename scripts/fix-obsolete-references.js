const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const mobileDocsDir = path.join(__dirname, '..', 'mobile', 'docs');

// Références obsolètes à corriger
const obsoleteReferences = {
  // Services refactorisés
  'mobile/lib/services/dashboard.ts': 'mobile/lib/services/domain/plots/plots.service.ts (refactorisé)',
  'mobile/lib/services/dashboard.js': 'mobile/lib/services/domain/plots/plots.service.ts (refactorisé)',
  'lib/services/dashboard.ts': 'lib/services/domain/plots/plots.service.ts (refactorisé)',
  
  // Fichiers supprimés ou renommés
  'mobile/lib/services/collecte.ts': 'mobile/lib/services/domain/plots/plots.service.ts (refactorisé)',
  'mobile/lib/services/farmFileGenerator.ts': 'mobile/lib/services/domain/plots/plots.service.ts (refactorisé)',
  
  // Chemins obsolètes
  'mobile/app/(tabs)/agent-dashboard.tsx': 'mobile/app/(tabs)/agent-dashboard.tsx (existe toujours)',
  'mobile/app/(tabs)/dashboard.tsx': 'mobile/app/(tabs)/agent-dashboard.tsx (renommé)',
  
  // Types obsolètes
  'types/collecte.ts': 'types/database.ts (unifié)',
  'mobile/types/collecte.ts': 'mobile/types/database.ts (unifié)',
};

// Fichiers à ignorer (documentation historique)
const ignoreFiles = [
  'MIGRATION_FINAL_STATUS.md',
  'MIGRATION_SUCCESS_VALIDATED.md',
  'MIGRATION_COMPLETE_FINAL.md',
  'FINAL_MIGRATION_SUMMARY.md',
  'FRONTEND_MIGRATION_COMPLETE.md',
  'MIGRATION_PROGRESS.md',
  'MIGRATION_COMPLETE.md',
  'RENAME_MIGRATION_SIMPLIFIED.md',
  'RENAME_MIGRATION_PLAN.md',
  'ANALYSIS_RESULTS.md',
  'REFACTORING_SUMMARY.md',
  'refactoring-plots-to-farm-file-plots.md',
  'RPC_FIXES_SUMMARY.md'
];

function fixObsoleteReferences(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [obsolete, replacement] of Object.entries(obsoleteReferences)) {
    const regex = new RegExp(obsolete.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.match(regex)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigé: ${path.relative(docsDir, filePath)}`);
  }
}

function traverseDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (file.isFile() && file.name.endsWith('.md')) {
      // Ignorer les fichiers de documentation historique
      if (!ignoreFiles.includes(file.name)) {
        fixObsoleteReferences(fullPath);
      }
    }
  }
}

console.log('🔧 Correction des références obsolètes dans la documentation...');
console.log('📁 Traitement du dossier docs/...');
traverseDirectory(docsDir);

console.log('📁 Traitement du dossier mobile/docs/...');
if (fs.existsSync(mobileDocsDir)) {
  traverseDirectory(mobileDocsDir);
}

console.log('✅ Correction des références obsolètes terminée !');
