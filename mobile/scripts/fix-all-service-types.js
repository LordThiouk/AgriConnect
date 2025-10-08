/**
 * Script pour corriger tous les services avec les vrais types
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Services à corriger
const services = [
  'operations', 'observations', 'visits', 'media', 'farmfiles', 
  'auth', 'participants', 'cooperatives', 'notifications', 
  'recommendations', 'seasons', 'inputs', 'agent-assignments'
];

function fixServiceTypes(serviceName) {
  const typesFile = path.join(servicesDir, serviceName, `${serviceName}.types.ts`);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Déterminer les types de base selon le service
    let baseTypes = [];
    let displayType = '';
    
    switch(serviceName) {
      case 'operations':
        baseTypes = ['Operation', 'OperationInsert', 'OperationUpdate'];
        displayType = 'OperationDisplay';
        break;
      case 'observations':
        baseTypes = ['Observation', 'ObservationInsert', 'ObservationUpdate'];
        displayType = 'ObservationDisplay';
        break;
      case 'visits':
        baseTypes = ['Visit', 'VisitInsert', 'VisitUpdate'];
        displayType = 'VisitDisplay';
        break;
      case 'media':
        baseTypes = ['Media', 'MediaInsert', 'MediaUpdate'];
        displayType = 'MediaDisplay';
        break;
      case 'farmfiles':
        baseTypes = ['FarmFile', 'FarmFileInsert', 'FarmFileUpdate'];
        displayType = 'FarmFileDisplay';
        break;
      case 'auth':
        baseTypes = ['Profile', 'ProfileInsert', 'ProfileUpdate'];
        displayType = 'ProfileDisplay';
        break;
      case 'participants':
        baseTypes = ['Participant', 'ParticipantInsert', 'ParticipantUpdate'];
        displayType = 'ParticipantDisplay';
        break;
      case 'cooperatives':
        baseTypes = ['Cooperative', 'CooperativeInsert', 'CooperativeUpdate'];
        displayType = 'CooperativeDisplay';
        break;
      case 'notifications':
        baseTypes = ['Notification', 'NotificationInsert', 'NotificationUpdate'];
        displayType = 'NotificationDisplay';
        break;
      case 'recommendations':
        baseTypes = ['Recommendation', 'RecommendationInsert', 'RecommendationUpdate'];
        displayType = 'RecommendationDisplay';
        break;
      case 'seasons':
        baseTypes = ['Season', 'SeasonInsert', 'SeasonUpdate'];
        displayType = 'SeasonDisplay';
        break;
      case 'inputs':
        baseTypes = ['Input', 'InputInsert', 'InputUpdate'];
        displayType = 'InputDisplay';
        break;
      case 'agent-assignments':
        baseTypes = ['AgentAssignment', 'AgentAssignmentInsert', 'AgentAssignmentUpdate'];
        displayType = 'AgentAssignmentDisplay';
        break;
    }
    
    // Remplacer l'import
    const newImport = `import { ${baseTypes.join(', ')}, CacheTTL } from '../../../types/core';`;
    
    // Supprimer les anciens imports et exports
    content = content.replace(
      /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Row'\];\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Insert'\];\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Update'\];/g,
      newImport
    );
    
    // Si le remplacement n'a pas fonctionné, essayer une approche plus simple
    if (content.includes('Database[')) {
      content = content.replace(
        /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?/g,
        newImport
      );
      
      content = content.replace(
        /export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['\w+'\];\s*\n/g,
        ''
      );
    }
    
    // Ajouter les exports des types de base
    const exportTypes = `\n// Réexport des types de base\nexport type { ${baseTypes.join(', ')} };\n`;
    
    // Insérer après l'import
    const importEndIndex = content.indexOf('} from \'../../../types/core\';');
    if (importEndIndex !== -1) {
      const insertIndex = importEndIndex + content.substring(importEndIndex).indexOf('\n') + 1;
      content = content.substring(0, insertIndex) + exportTypes + content.substring(insertIndex);
    }
    
    // Mettre à jour le type Display pour étendre le type de base
    const displayTypeRegex = new RegExp(`export interface ${displayType} \\{[^}]+\\}`, 'g');
    const baseType = baseTypes[0]; // Le type Row
    content = content.replace(displayTypeRegex, `export interface ${displayType} extends ${baseType} {`);
    
    fs.writeFileSync(typesFile, content);
    console.log(`✅ Corrigé: ${serviceName}.types.ts`);
    
  } catch (error) {
    console.error(`❌ Erreur ${serviceName}:`, error.message);
  }
}

console.log('🔧 Correction de tous les services...\n');

services.forEach(service => {
  fixServiceTypes(service);
});

console.log('\n✅ Correction terminée !');
