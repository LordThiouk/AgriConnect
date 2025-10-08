/**
 * Script final pour corriger tous les types Display
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../lib/services/domain');

// Services à corriger avec leurs propriétés Display
const services = [
  {
    name: 'operations',
    displayType: 'OperationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  operator_name?: string;`
  },
  {
    name: 'observations',
    displayType: 'ObservationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  observer_name?: string;
  title?: string;
  type?: string;
  author?: string;`
  },
  {
    name: 'visits',
    displayType: 'VisitDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  agent_name?: string;`
  },
  {
    name: 'media',
    displayType: 'MediaDisplay',
    properties: `
  entity_name?: string;
  owner_name?: string;`
  },
  {
    name: 'farmfiles',
    displayType: 'FarmFileDisplay',
    properties: `
  producer_name?: string;
  cooperative_name?: string;
  plots_count?: number;`
  },
  {
    name: 'auth',
    displayType: 'ProfileDisplay',
    properties: `
  cooperative_name?: string;
  role_display?: string;`
  },
  {
    name: 'participants',
    displayType: 'ParticipantDisplay',
    properties: `
  plot_name?: string;
  farm_file_name?: string;
  producer_name?: string;`
  },
  {
    name: 'cooperatives',
    displayType: 'CooperativeDisplay',
    properties: `
  producers_count?: number;
  plots_count?: number;`
  },
  {
    name: 'notifications',
    displayType: 'NotificationDisplay',
    properties: `
  recipient_name?: string;
  sender_name?: string;`
  },
  {
    name: 'recommendations',
    displayType: 'RecommendationDisplay',
    properties: `
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;`
  },
  {
    name: 'seasons',
    displayType: 'SeasonDisplay',
    properties: `
  crops_count?: number;
  plots_count?: number;`
  },
  {
    name: 'inputs',
    displayType: 'InputDisplay',
    properties: `
  supplier_name?: string;
  category_display?: string;`
  },
  {
    name: 'agent-assignments',
    displayType: 'AgentAssignmentDisplay',
    properties: `
  agent_name?: string;
  assigned_to_name?: string;`
  }
];

function fixDisplayType(serviceName, displayType, properties) {
  const typesFile = path.join(servicesDir, serviceName, `${serviceName}.types.ts`);
  
  if (!fs.existsSync(typesFile)) {
    console.log(`⚠️  Fichier types non trouvé: ${typesFile}`);
    return;
  }

  try {
    let content = fs.readFileSync(typesFile, 'utf8');
    
    // Chercher le type Display vide ou mal formé
    const emptyDisplayRegex = new RegExp(`export interface ${displayType} extends \\w+ \\{\\s*\\}`, 'g');
    const malformedDisplayRegex = new RegExp(`export interface ${displayType} extends \\w+ \\{\\s*\\n\\s*export interface`, 'g');
    
    if (emptyDisplayRegex.test(content)) {
      // Remplacer le type Display vide
      const newDisplayType = `export interface ${displayType} extends ${displayType.replace('Display', '')} {${properties}\n}`;
      content = content.replace(emptyDisplayRegex, newDisplayType);
    } else if (malformedDisplayRegex.test(content)) {
      // Remplacer le type Display mal formé
      const newDisplayType = `export interface ${displayType} extends ${displayType.replace('Display', '')} {${properties}\n}\n\nexport interface`;
      content = content.replace(malformedDisplayRegex, newDisplayType);
    } else {
      console.log(`ℹ️  ${serviceName}.${serviceName}.types.ts déjà correct`);
      return;
    }
    
    fs.writeFileSync(typesFile, content);
    console.log(`✅ Corrigé: ${serviceName}.types.ts`);
    
  } catch (error) {
    console.error(`❌ Erreur ${serviceName}:`, error.message);
  }
}

console.log('🔧 Correction finale des types Display...\n');

services.forEach(({ name, displayType, properties }) => {
  fixDisplayType(name, displayType, properties);
});

console.log('\n✅ Correction terminée !');
