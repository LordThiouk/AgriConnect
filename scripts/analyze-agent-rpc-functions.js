#!/usr/bin/env node

/**
 * Script d'analyse des RPC functions liées aux agents et assignations
 * Objectif : Identifier toutes les fonctions à migrer vers la nouvelle logique d'assignations unifiée
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 ANALYSE DES RPC FUNCTIONS AGENTS & ASSIGNATIONS');
console.log('==================================================');
console.log('');

async function analyzeRPCFunctions() {
  try {
    console.log('📋 RECHERCHE DES RPC FUNCTIONS AGENTS...');
    console.log('');
    
    // 1. Analyser les migrations pour identifier les RPC functions
    console.log('🔍 Analyse des migrations existantes...');
    
    const migrationFiles = [
      '20250918192000_update_agent_rpc.sql',
      '20250918155117_add_is_active_to_profiles.sql',
      '20250918172805_ensure_approval_status_column.sql',
      '20250926033921_fix_get_farm_files_assignments.sql'
    ];
    
    // 2. Liste des RPC functions connues liées aux agents
    const knownAgentFunctions = [
      'get_agent_producers',
      'get_agent_performance', 
      'get_agents_stats',
      'update_agent_profile',
      'delete_agent_profile',
      'assign_producer_to_agent',
      'unassign_producer_from_agent',
      'get_assigned_agents_for_producer',
      'get_available_agents',
      'get_available_producers',
      'update_agent_approval_status'
    ];
    
    console.log(`✅ ${knownAgentFunctions.length} fonctions agents identifiées`);
    console.log('');
    
    // 3. Tester l'existence de chaque fonction
    const existingFunctions = [];
    const functionsToMigrate = [];
    
    for (const functionName of knownAgentFunctions) {
      console.log(`🔍 Test de: ${functionName}`);
      
      try {
        // Tenter d'appeler la fonction pour vérifier son existence
        const { data, error } = await supabase.rpc(functionName, {});
        
        if (error) {
          // Si erreur de paramètres, la fonction existe mais nécessite des paramètres
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`   ❌ Fonction inexistante: ${functionName}`);
          } else {
            console.log(`   ✅ Fonction existante: ${functionName} (erreur de paramètres normale)`);
            existingFunctions.push(functionName);
          }
        } else {
          console.log(`   ✅ Fonction existante: ${functionName}`);
          existingFunctions.push(functionName);
        }
      } catch (err) {
        console.log(`   ❌ Erreur lors du test: ${functionName} - ${err.message}`);
      }
    }
    
    console.log('');
    
    // 4. Analyser les fonctions qui utilisent agent_producer_assignments
    const assignmentFunctions = [
      'get_agent_producers',
      'assign_producer_to_agent', 
      'unassign_producer_from_agent',
      'get_assigned_agents_for_producer'
    ];
    
    console.log('🔗 Fonctions utilisant agent_producer_assignments:');
    assignmentFunctions.forEach(func => {
      if (existingFunctions.includes(func)) {
        console.log(`   ⚠️  ${func} - Nécessite une migration`);
        functionsToMigrate.push({
          name: func,
          analysis: { needsMigration: true, usesAgentProducerAssignments: true }
        });
      } else {
        console.log(`   ❓ ${func} - Fonction non trouvée`);
      }
    });
    
    console.log('');
    
    // 5. Générer le plan de migration
    generateMigrationPlan(functionsToMigrate, existingFunctions);

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

function analyzeFunctionContent(functionName, functionBody) {
  const analysis = {
    hasAgentLogic: false,
    hasAssignmentLogic: false,
    usesAgentProducerAssignments: false,
    usesProfilesTable: false,
    usesProducersTable: false,
    usesCooperativesTable: false,
    needsMigration: false,
    dependencies: [],
    complexity: 'low'
  };

  const body = functionBody.toLowerCase();

  // Vérifier la logique agent
  if (body.includes('agent') || body.includes('profiles')) {
    analysis.hasAgentLogic = true;
    analysis.usesProfilesTable = true;
  }

  // Vérifier la logique d'assignation
  if (body.includes('assignment') || body.includes('assign') || body.includes('producer')) {
    analysis.hasAssignmentLogic = true;
  }

  // Vérifier l'utilisation de agent_producer_assignments
  if (body.includes('agent_producer_assignments')) {
    analysis.usesAgentProducerAssignments = true;
    analysis.needsMigration = true;
  }

  // Vérifier les autres tables
  if (body.includes('producers')) {
    analysis.usesProducersTable = true;
  }
  
  if (body.includes('cooperatives')) {
    analysis.usesCooperativesTable = true;
  }

  // Déterminer la complexité
  const complexityIndicators = [
    body.includes('union'),
    body.includes('join'),
    body.includes('case when'),
    body.includes('subquery'),
    (body.match(/select/g) || []).length > 3
  ];
  
  const complexityScore = complexityIndicators.filter(Boolean).length;
  if (complexityScore >= 3) {
    analysis.complexity = 'high';
  } else if (complexityScore >= 1) {
    analysis.complexity = 'medium';
  }

  // Identifier les dépendances
  if (body.includes('get_agent_')) {
    analysis.dependencies.push('agent_functions');
  }
  if (body.includes('get_producer_')) {
    analysis.dependencies.push('producer_functions');
  }

  return analysis;
}

function generateMigrationPlan(functionName, analysis) {
  const plans = {
    'get_agent_producers': {
      priority: 'high',
      changes: [
        'Remplacer agent_producer_assignments par agent_assignments',
        'Ajouter la logique UNION pour coopératives et producteurs directs',
        'Ajouter le champ assignment_type dans le retour'
      ],
      newLogic: `
        -- Nouvelle logique avec table unifiée
        SELECT p.id, p.display_name, c.name, 'direct'::TEXT as assignment_type
        FROM agent_assignments aa
        JOIN producers p ON aa.assigned_to_id = p.id
        JOIN cooperatives c ON p.cooperative_id = c.id
        WHERE aa.agent_id = p_agent_id AND aa.assigned_to_type = 'producer'
        
        UNION
        
        SELECT p.id, p.display_name, c.name, 'cooperative'::TEXT as assignment_type
        FROM agent_assignments aa
        JOIN cooperatives c ON aa.assigned_to_id = c.id
        JOIN producers p ON p.cooperative_id = c.id
        WHERE aa.agent_id = p_agent_id AND aa.assigned_to_type = 'cooperative'
      `
    },
    'assign_producer_to_agent': {
      priority: 'high',
      changes: [
        'Utiliser agent_assignments avec assigned_to_type = "producer"',
        'Ajouter la gestion des conflits UNIQUE'
      ],
      newLogic: `
        INSERT INTO agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_by)
        VALUES (p_agent_id, 'producer', p_producer_id, p_assigned_by)
        ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING
      `
    },
    'unassign_producer_from_agent': {
      priority: 'medium',
      changes: [
        'Utiliser agent_assignments avec assigned_to_type = "producer"'
      ],
      newLogic: `
        DELETE FROM agent_assignments 
        WHERE agent_id = p_agent_id 
        AND assigned_to_type = 'producer' 
        AND assigned_to_id = p_producer_id
      `
    }
  };

  return plans[functionName] || {
    priority: 'low',
    changes: ['Vérifier la compatibilité avec la nouvelle table'],
    newLogic: 'À déterminer selon la fonction'
  };
}

function displayAnalysisResults(agentFunctions, assignmentFunctions, functionsToMigrate) {
  console.log('📊 RÉSULTATS DE L\'ANALYSE');
  console.log('==========================');
  console.log('');
  
  console.log(`🔍 Fonctions avec logique agent: ${agentFunctions.length}`);
  agentFunctions.forEach(func => {
    console.log(`   - ${func.name} (complexité: ${func.analysis.complexity})`);
  });
  console.log('');
  
  console.log(`🔗 Fonctions avec logique d'assignation: ${assignmentFunctions.length}`);
  assignmentFunctions.forEach(func => {
    console.log(`   - ${func.name} (complexité: ${func.analysis.complexity})`);
  });
  console.log('');
  
  console.log(`⚠️  Fonctions nécessitant une migration: ${functionsToMigrate.length}`);
  functionsToMigrate.forEach(func => {
    console.log(`   - ${func.name} (priorité: ${func.migrationPlan.priority})`);
    console.log(`     Utilise agent_producer_assignments: ${func.analysis.usesAgentProducerAssignments}`);
    console.log(`     Complexité: ${func.analysis.complexity}`);
  });
  console.log('');
}

function generateMigrationPlan(functionsToMigrate, existingFunctions) {
  console.log('🚀 PLAN DE MIGRATION RECOMMANDÉ');
  console.log('================================');
  console.log('');
  
  console.log(`📊 STATISTIQUES:`);
  console.log(`   - Fonctions existantes: ${existingFunctions.length}`);
  console.log(`   - Fonctions à migrer: ${functionsToMigrate.length}`);
  console.log('');
  
  console.log('⚠️  FONCTIONS NÉCESSITANT UNE MIGRATION:');
  functionsToMigrate.forEach(func => {
    console.log(`   📝 ${func.name}`);
    console.log(`      - Utilise agent_producer_assignments`);
    console.log(`      - Doit être adaptée pour agent_assignments`);
    console.log('');
  });
  
  console.log('🎯 NOUVELLES FONCTIONS À CRÉER:');
  console.log('   📝 assign_agent_to_cooperative');
  console.log('   📝 get_agent_assignments');
  console.log('   📝 remove_agent_assignment');
  console.log('   📝 get_agent_cooperatives');
  console.log('   📝 get_agent_producers_unified (nouvelle version)');
  console.log('');
  
  console.log('📋 ORDRE DE MIGRATION RECOMMANDÉ:');
  console.log('   1. Créer la table agent_assignments');
  console.log('   2. Migrer les données existantes depuis agent_producer_assignments');
  console.log('   3. Créer les nouvelles RPC functions');
  console.log('   4. Modifier les RPC functions existantes:');
  functionsToMigrate.forEach(func => {
    console.log(`      - ${func.name}`);
  });
  console.log('   5. Tester toutes les fonctions');
  console.log('   6. Mettre à jour le frontend (agentsService.ts)');
  console.log('   7. Supprimer l\'ancienne table agent_producer_assignments');
  console.log('');
  
  console.log('🔧 MODIFICATIONS FRONTEND REQUISES:');
  console.log('   - agentsService.ts: Adapter les appels RPC');
  console.log('   - AgentModal.tsx: Supprimer le champ cooperative direct');
  console.log('   - Types TypeScript: Mettre à jour les interfaces');
  console.log('   - Nouveau composant: AgentAssignmentModal pour gérer les assignations');
  console.log('');
  
  console.log('🧪 TESTS À EFFECTUER:');
  console.log('   - Test de création d\'agent');
  console.log('   - Test d\'assignation à une coopérative');
  console.log('   - Test d\'assignation à un producteur');
  console.log('   - Test de récupération des producteurs d\'un agent');
  console.log('   - Test de suppression d\'assignation');
}

// Exécuter l'analyse
analyzeRPCFunctions().then(() => {
  console.log('');
  console.log('✅ Analyse terminée !');
  console.log('📄 Consultez les résultats ci-dessus pour le plan de migration.');
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
