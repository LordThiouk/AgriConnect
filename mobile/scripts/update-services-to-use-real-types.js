/**
 * Script pour mettre à jour tous les services pour utiliser les vrais types de la base
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Mapping des services et leurs types de base
const serviceMappings = [
  {
    service: 'plots',
    baseTypes: ['Plot', 'PlotInsert', 'PlotUpdate'],
    displayType: 'PlotDisplay'
  },
  {
    service: 'crops',
    baseTypes: ['Crop', 'CropInsert', 'CropUpdate'],
    displayType: 'CropDisplay'
  },
  {
    service: 'operations',
    baseTypes: ['Operation', 'OperationInsert', 'OperationUpdate'],
    displayType: 'OperationDisplay'
  },
  {
    service: 'observations',
    baseTypes: ['Observation', 'ObservationInsert', 'ObservationUpdate'],
    displayType: 'ObservationDisplay'
  },
  {
    service: 'visits',
    baseTypes: ['Visit', 'VisitInsert', 'VisitUpdate'],
    displayType: 'VisitDisplay'
  },
  {
    service: 'media',
    baseTypes: ['Media', 'MediaInsert', 'MediaUpdate'],
    displayType: 'MediaDisplay'
  },
  {
    service: 'farmfiles',
    baseTypes: ['FarmFile', 'FarmFileInsert', 'FarmFileUpdate'],
    displayType: 'FarmFileDisplay'
  },
  {
    service: 'auth',
    baseTypes: ['Profile', 'ProfileInsert', 'ProfileUpdate'],
    displayType: 'ProfileDisplay'
  },
  {
    service: 'participants',
    baseTypes: ['Participant', 'ParticipantInsert', 'ParticipantUpdate'],
    displayType: 'ParticipantDisplay'
  },
  {
    service: 'cooperatives',
    baseTypes: ['Cooperative', 'CooperativeInsert', 'CooperativeUpdate'],
    displayType: 'CooperativeDisplay'
  },
  {
    service: 'notifications',
    baseTypes: ['Notification', 'NotificationInsert', 'NotificationUpdate'],
    displayType: 'NotificationDisplay'
  },
  {
    service: 'recommendations',
    baseTypes: ['Recommendation', 'RecommendationInsert', 'RecommendationUpdate'],
    displayType: 'RecommendationDisplay'
  },
  {
    service: 'seasons',
    baseTypes: ['Season', 'SeasonInsert', 'SeasonUpdate'],
    displayType: 'SeasonDisplay'
  },
  {
    service: 'inputs',
    baseTypes: ['Input', 'InputInsert', 'InputUpdate'],
    displayType: 'InputDisplay'
  },
  {
    service: 'agent-assignments',
    baseTypes: ['AgentAssignment', 'AgentAssignmentInsert', 'AgentAssignmentUpdate'],
    displayType: 'AgentAssignmentDisplay'
  }
];

function updateServiceTypes(serviceName, baseTypes, displayType) {
  const typesFile = path.join(servicesDir, serviceName, `${serviceName}.types.ts`);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Remplacer l'import par les vrais types
    const newImport = `import { ${baseTypes.join(', ')}, CacheTTL } from '../../../types/core';`;
    
    // Supprimer les anciens imports Database
    content = content.replace(
      /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Row'\];\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Insert'\];\s*\n\s*export\s*type\s+\w+\s*=\s*Database\['public'\]\['Tables'\]\['\w+'\]\['Update'\];/g,
      newImport
    );
    
    // Si le remplacement n'a pas fonctionné, essayer une approche plus simple
    if (content.includes('Database[')) {
      // Remplacer les imports Database
      content = content.replace(
        /import\s*{\s*Database\s*}\s*from\s*['"][^'"]+['"];?\s*\nimport\s*{\s*CacheTTL\s*}\s*from\s*['"][^'"]+['"];?/g,
        newImport
      );
      
      // Supprimer les exports de types redondants
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
    console.log(`✅ Mis à jour: ${serviceName}.types.ts`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${serviceName}:`, error.message);
  }
}

console.log('🔄 Mise à jour des services pour utiliser les vrais types...\n');

serviceMappings.forEach(({ service, baseTypes, displayType }) => {
  updateServiceTypes(service, baseTypes, displayType);
});

console.log('\n✅ Mise à jour terminée !');
