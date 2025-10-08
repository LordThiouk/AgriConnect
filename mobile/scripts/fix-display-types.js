/**
 * Script pour corriger les types Display avec les propriétés manquantes
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Mapping des propriétés à ajouter pour chaque type Display
const displayTypeProperties = {
  'crops': {
    file: 'crops.types.ts',
    type: 'CropDisplay',
    properties: `
  plot_name?: string;
  season_name?: string;
  producer_name?: string;
  cooperative_name?: string;`
  },
  'operations': {
    file: 'operations.types.ts',
    type: 'OperationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  operator_name?: string;`
  },
  'observations': {
    file: 'observations.types.ts',
    type: 'ObservationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  observer_name?: string;
  title?: string;
  type?: string;
  author?: string;`
  },
  'visits': {
    file: 'visits.types.ts',
    type: 'VisitDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  agent_name?: string;`
  },
  'media': {
    file: 'media.types.ts',
    type: 'MediaDisplay',
    properties: `
  entity_name?: string;
  owner_name?: string;`
  },
  'farmfiles': {
    file: 'farmfiles.types.ts',
    type: 'FarmFileDisplay',
    properties: `
  producer_name?: string;
  cooperative_name?: string;
  plots_count?: number;`
  },
  'auth': {
    file: 'auth.types.ts',
    type: 'ProfileDisplay',
    properties: `
  cooperative_name?: string;
  role_display?: string;`
  },
  'participants': {
    file: 'participants.types.ts',
    type: 'ParticipantDisplay',
    properties: `
  plot_name?: string;
  farm_file_name?: string;
  producer_name?: string;`
  },
  'cooperatives': {
    file: 'cooperatives.types.ts',
    type: 'CooperativeDisplay',
    properties: `
  producers_count?: number;
  plots_count?: number;`
  },
  'notifications': {
    file: 'notifications.types.ts',
    type: 'NotificationDisplay',
    properties: `
  recipient_name?: string;
  sender_name?: string;`
  },
  'recommendations': {
    file: 'recommendations.types.ts',
    type: 'RecommendationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;`
  },
  'seasons': {
    file: 'seasons.types.ts',
    type: 'SeasonDisplay',
    properties: `
  crops_count?: number;
  plots_count?: number;`
  },
  'inputs': {
    file: 'inputs.types.ts',
    type: 'InputDisplay',
    properties: `
  supplier_name?: string;
  category_display?: string;`
  },
  'agent-assignments': {
    file: 'agent-assignments.types.ts',
    type: 'AgentAssignmentDisplay',
    properties: `
  agent_name?: string;
  assigned_to_name?: string;`
  }
};

function fixDisplayType(serviceName, config) {
  const typesFile = path.join(servicesDir, serviceName, config.file);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Chercher le type Display vide
    const emptyDisplayRegex = new RegExp(`export interface ${config.type} extends \\w+ \\{\\s*\\}`, 'g');
    
    if (emptyDisplayRegex.test(content)) {
      // Remplacer le type Display vide par un type avec propriétés
      const newDisplayType = `export interface ${config.type} extends ${config.type.replace('Display', '')} {${config.properties}\n}`;
      content = content.replace(emptyDisplayRegex, newDisplayType);
      
      fs.writeFileSync(typesFile, content);
      console.log(`✅ Corrigé: ${serviceName}.${config.file}`);
    } else {
      console.log(`ℹ️  ${serviceName}.${config.file} déjà correct`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur ${serviceName}:`, error.message);
  }
}

console.log('🔧 Correction des types Display...\n');

Object.entries(displayTypeProperties).forEach(([serviceName, config]) => {
  fixDisplayType(serviceName, config);
});

console.log('\n✅ Correction terminée !');
