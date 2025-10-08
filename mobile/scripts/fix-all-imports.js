/**
 * Script pour corriger tous les imports de types dans les services
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Mapping des services et leurs tables
const serviceMappings = [
  { service: 'operations', table: 'operations' },
  { service: 'observations', table: 'observations' },
  { service: 'visits', table: 'visits' },
  { service: 'media', table: 'media' },
  { service: 'farmfiles', table: 'farm_files' },
  { service: 'auth', table: 'profiles' },
  { service: 'participants', table: 'participants' },
  { service: 'cooperatives', table: 'cooperatives' },
  { service: 'notifications', table: 'notifications' },
  { service: 'recommendations', table: 'recommendations' },
  { service: 'seasons', table: 'seasons' },
  { service: 'inputs', table: 'inputs' },
  { service: 'agent-assignments', table: 'agent_assignments' }
];

function fixServiceImports(serviceName, tableName) {
  const typesFile = path.join(servicesDir, serviceName, `${serviceName}.types.ts`);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Remplacer l'import par Database
    const newImport = `import { Database, CacheTTL } from '../../../types/core';

type ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')} = Database['public']['Tables']['${tableName}']['Row'];
type ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}Insert = Database['public']['Tables']['${tableName}']['Insert'];
type ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}Update = Database['public']['Tables']['${tableName}']['Update'];`;
    
    // Supprimer les anciens imports
    content = content.replace(
      /import\s*{\s*[^}]+}\s*from\s*['"][^'"]+['"];?\s*\n/g,
      ''
    );
    
    // Ajouter le nouvel import au début
    content = newImport + '\n\n' + content;
    
    // Corriger les exports
    const typeName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '');
    content = content.replace(
      /export\s*type\s*{\s*[^}]+}\s*;/g,
      `export type { ${typeName}, ${typeName}Insert, ${typeName}Update };`
    );
    
    fs.writeFileSync(typesFile, content);
    console.log(`✅ Corrigé: ${serviceName}.types.ts`);
    
  } catch (error) {
    console.error(`❌ Erreur ${serviceName}:`, error.message);
  }
}

console.log('🔧 Correction des imports de types...\n');

serviceMappings.forEach(({ service, table }) => {
  fixServiceImports(service, table);
});

console.log('\n✅ Correction terminée !');
