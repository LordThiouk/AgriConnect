/**
 * Script pour corriger les erreurs de lint dans les services
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Services à corriger
const services = [
  'cooperatives', 'notifications', 'inputs', 'participants', 'plots', 'crops'
];

function fixServiceLintErrors(serviceName) {
  const serviceDir = path.join(servicesDir, serviceName);
  const files = ['cache.ts', 'service.ts', 'types.ts'];
  
  files.forEach(file => {
    const filePath = path.join(serviceDir, `${serviceName}.${file}`);
    
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Corriger les imports AgriConnectCache
      content = content.replace(
        /import\s*{\s*AgriConnectCache\s*}\s*from\s*['"][^'"]+['"];?/g,
        `import { agriConnectCache } from '../../core/cache';`
      );
      
      // Corriger les types AgriConnectCache
      content = content.replace(/AgriConnectCache/g, 'typeof agriConnectCache');
      
      // Corriger les appels getInstance()
      content = content.replace(/agriConnectCache\.getInstance\(\)/g, 'agriConnectCache');
      
      // Supprimer les imports inutilisés dans types.ts
      if (file === 'types.ts') {
        // Supprimer les imports de types non utilisés
        content = content.replace(
          /import\s*{\s*(\w+),\s*(\w+),\s*(\w+),\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?\s*\n/g,
          `import { CacheTTL } from '../../../types/core';\n`
        );
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigé: ${serviceName}.${file}`);
      
    } catch (error) {
      console.error(`❌ Erreur ${serviceName}.${file}:`, error.message);
    }
  });
}

console.log('🔧 Correction des erreurs de lint...\n');

services.forEach(service => {
  fixServiceLintErrors(service);
});

console.log('\n✅ Correction terminée !');
