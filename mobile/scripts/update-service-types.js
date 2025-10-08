/**
 * Script pour mettre à jour tous les services avec les vrais types de la base
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Mapping des services et leurs types
const serviceTypes = [
  { service: 'operations', types: ['Operation', 'OperationInsert', 'OperationUpdate'] },
  { service: 'observations', types: ['Observation', 'ObservationInsert', 'ObservationUpdate'] },
  { service: 'visits', types: ['Visit', 'VisitInsert', 'VisitUpdate'] },
  { service: 'media', types: ['Media', 'MediaInsert', 'MediaUpdate'] },
  { service: 'farmfiles', types: ['FarmFile', 'FarmFileInsert', 'FarmFileUpdate'] },
  { service: 'auth', types: ['Profile', 'ProfileInsert', 'ProfileUpdate'] },
  { service: 'participants', types: ['Participant', 'ParticipantInsert', 'ParticipantUpdate'] },
  { service: 'cooperatives', types: ['Cooperative', 'CooperativeInsert', 'CooperativeUpdate'] },
  { service: 'notifications', types: ['Notification', 'NotificationInsert', 'NotificationUpdate'] },
  { service: 'recommendations', types: ['Recommendation', 'RecommendationInsert', 'RecommendationUpdate'] },
  { service: 'seasons', types: ['Season', 'SeasonInsert', 'SeasonUpdate'] },
  { service: 'inputs', types: ['Input', 'InputInsert', 'InputUpdate'] },
  { service: 'agent-assignments', types: ['AgentAssignment', 'AgentAssignmentInsert', 'AgentAssignmentUpdate'] }
];

function updateServiceTypes(serviceName, types) {
  const typesFile = path.join(servicesDir, serviceName, `${serviceName}.types.ts`);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Remplacer l'import Database par l'import centralisé
    const oldImportRegex = /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?\s*\n\s*export\s*type\s+(\w+)\s*=\s*Database\['public'\]\['Tables'\]\['(\w+)'\]\['Row'\];\s*\n\s*export\s*type\s+(\w+)\s*=\s*Database\['public'\]\['Tables'\]\['(\w+)'\]\['Insert'\];\s*\n\s*export\s*type\s+(\w+)\s*=\s*Database\['public'\]\['Tables'\]\['(\w+)'\]\['Update'\];/g;
    
    const newImport = `import { ${types.join(', ')}, CacheTTL } from '../../../types/core';`;
    
    content = content.replace(oldImportRegex, newImport);
    
    // Si le remplacement n'a pas fonctionné, essayer une approche plus simple
    if (content.includes('Database[')) {
      // Remplacer les imports Database
      content = content.replace(
        /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?/g,
        `import { ${types.join(', ')}, CacheTTL } from '../../../types/core';`
      );
      
      // Supprimer les exports de types redondants
      content = content.replace(
        /export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['\w+'\];\s*\n/g,
        ''
      );
    }
    
    fs.writeFileSync(typesFile, content);
    console.log(`✅ Mis à jour: ${serviceName}.types.ts`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${serviceName}:`, error.message);
  }
}

console.log('🔄 Mise à jour des types des services...\n');

serviceTypes.forEach(({ service, types }) => {
  updateServiceTypes(service, types);
});

console.log('\n✅ Mise à jour terminée !');
