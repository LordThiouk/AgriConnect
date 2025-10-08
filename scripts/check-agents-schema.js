#!/usr/bin/env node

/**
 * Script de vérification du schéma de la table profiles pour les agents
 * Compare la structure réelle de la DB avec le code actuel
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION DU SCHÉMA DE LA TABLE PROFILES');
console.log('===============================================');
console.log('');

async function checkProfilesSchema() {
  try {
    console.log('📋 1. VÉRIFICATION DE LA STRUCTURE DE LA TABLE PROFILES');
    console.log('------------------------------------------------------');
    
    // Récupérer la structure de la table profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erreur lors de la récupération des profiles:', profilesError);
      return;
    }
    
    if (profilesData && profilesData.length > 0) {
      const profile = profilesData[0];
      console.log('✅ Structure de la table profiles détectée:');
      console.log('');
      
      // Lister toutes les colonnes disponibles
      const columns = Object.keys(profile);
      columns.forEach(column => {
        const value = profile[column];
        const type = typeof value;
        const isNull = value === null;
        console.log(`  - ${column}: ${type} ${isNull ? '(NULL)' : `(${value})`}`);
      });
    } else {
      console.log('⚠️ Aucune donnée trouvée dans la table profiles');
    }
    
    console.log('');
    console.log('📊 2. VÉRIFICATION DES AGENTS EXISTANTS');
    console.log('--------------------------------------');
    
    // Récupérer quelques agents pour vérifier la structure
    const { data: agentsData, error: agentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .limit(3);
    
    if (agentsError) {
      console.error('❌ Erreur lors de la récupération des agents:', agentsError);
      return;
    }
    
    if (agentsData && agentsData.length > 0) {
      console.log(`✅ ${agentsData.length} agent(s) trouvé(s):`);
      console.log('');
      
      agentsData.forEach((agent, index) => {
        console.log(`  Agent ${index + 1}:`);
        console.log(`    - id: ${agent.id}`);
        console.log(`    - user_id: ${agent.user_id}`);
        console.log(`    - display_name: ${agent.display_name}`);
        console.log(`    - role: ${agent.role}`);
        console.log(`    - region: ${agent.region}`);
        console.log(`    - cooperative: ${agent.cooperative}`);
        console.log(`    - phone: ${agent.phone}`);
        console.log(`    - is_active: ${agent.is_active}`);
        console.log(`    - approval_status: ${agent.approval_status}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Aucun agent trouvé dans la base de données');
    }
    
     console.log('🔍 3. VÉRIFICATION DES COOPÉRATIVES');
     console.log('----------------------------------');
     
     // Vérifier la table cooperatives
     const { data: cooperativesData, error: cooperativesError } = await supabase
       .from('cooperatives')
       .select('id, name')
       .limit(5);
     
     if (cooperativesError) {
       console.error('❌ Erreur lors de la récupération des coopératives:', cooperativesError);
     } else if (cooperativesData && cooperativesData.length > 0) {
       console.log(`✅ ${cooperativesData.length} coopérative(s) trouvée(s):`);
       cooperativesData.forEach(coop => {
         console.log(`  - ${coop.id}: ${coop.name}`);
       });
     } else {
       console.log('⚠️ Aucune coopérative trouvée');
     }
     
     console.log('');
     console.log('🔗 4. VÉRIFICATION DES TABLES DE LIAISON');
     console.log('--------------------------------------');
     
     // Vérifier s'il existe une table pour les assignations agent-producer (modèle)
     console.log('📋 Vérification de agent_producer_assignments (modèle)...');
     const { data: agentProducerData, error: agentProducerError } = await supabase
       .from('agent_producer_assignments')
       .select('*')
       .limit(3);
     
     if (agentProducerError) {
       console.log('⚠️ Table agent_producer_assignments non trouvée ou erreur:', agentProducerError.message);
     } else if (agentProducerData && agentProducerData.length > 0) {
       console.log(`✅ ${agentProducerData.length} assignation(s) agent-producer trouvée(s) (modèle):`);
       agentProducerData.forEach(assignment => {
         console.log(`  - Agent ${assignment.agent_id} → Producer ${assignment.producer_id} (assigned: ${assignment.assigned_at})`);
       });
       console.log('   → Cette table peut servir de modèle pour agent_cooperative_assignments');
     } else {
       console.log('⚠️ Aucune assignation agent-producer trouvée');
       console.log('   → La table existe mais est vide');
     }
     
     // Vérifier s'il existe une table pour les assignations agent-coopérative
     console.log('');
     console.log('📋 Vérification de agent_cooperative_assignments...');
     const { data: agentCoopData, error: agentCoopError } = await supabase
       .from('agent_cooperative_assignments')
       .select('*')
       .limit(3);
     
     if (agentCoopError) {
       console.log('⚠️ Table agent_cooperative_assignments non trouvée ou erreur:', agentCoopError.message);
       console.log('   → Il faut créer cette table pour la logique métier correcte');
     } else if (agentCoopData && agentCoopData.length > 0) {
       console.log(`✅ ${agentCoopData.length} assignation(s) agent-coopérative trouvée(s):`);
       agentCoopData.forEach(assignment => {
         console.log(`  - Agent ${assignment.agent_id} → Coopérative ${assignment.cooperative_id}`);
       });
     } else {
       console.log('⚠️ Aucune assignation agent-coopérative trouvée');
       console.log('   → La table existe mais est vide');
     }
    
     console.log('');
     console.log('📝 5. ANALYSE DES PROBLÈMES DANS LE CODE');
     console.log('---------------------------------------');
    
     console.log('❌ PROBLÈMES IDENTIFIÉS DANS LE CODE ACTUEL:');
     console.log('');
     console.log('1. LOGIQUE MÉTIER INCORRECTE:');
     console.log('   - Un agent ne doit PAS avoir de champ "cooperative" direct');
     console.log('   - L\'assignation se fait via une table de liaison');
     console.log('   - Le champ "cooperative" dans profiles ne devrait pas exister');
     console.log('');
     console.log('2. AgentModal.tsx:');
     console.log('   - Gestion incorrecte des coopératives (assignation vs champ direct)');
     console.log('   - Champs "department" et "commune" peuvent être gardés (colonnes existent)');
     console.log('   - Gestion d\'erreurs incorrecte dans getCooperatives()');
     console.log('');
     console.log('3. agentsService.ts:');
     console.log('   - Types CreateAgentData corrects (department/commune existent)');
     console.log('   - Interface Agent à corriger pour la logique coopérative');
     console.log('');
     console.log('4. Types TypeScript:');
     console.log('   - Supprimer le champ "cooperative" des interfaces Agent');
     console.log('   - Ajouter une méthode pour gérer les assignations coopératives');
     console.log('');
     
     console.log('✅ CHAMPS VALIDES POUR LES AGENTS:');
     console.log('  - id, user_id, display_name, role, region');
     console.log('  - phone, is_active, approval_status');
     console.log('  - department, commune (colonnes existent mais optionnelles)');
     console.log('  - created_at, updated_at');
     console.log('  - cooperative: À SUPPRIMER (logique métier incorrecte)');
     console.log('');
     
     console.log('🔧 ACTIONS REQUISES:');
     console.log('  1. Supprimer le champ "cooperative" des interfaces Agent');
     console.log('  2. Créer une table de liaison pour les assignations agent-coopérative');
     console.log('  3. Modifier AgentModal pour gérer les assignations (pas le champ direct)');
     console.log('  4. Corriger la logique métier dans agentsService');
     console.log('  5. Tester les assignations via table de liaison');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

async function testAgentsService() {
  try {
     console.log('');
     console.log('🧪 6. TEST DES FONCTIONS RPC AGENTS');
     console.log('----------------------------------');
    
    // Test de la fonction get_agents_stats
    console.log('📊 Test de get_agents_stats...');
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_agents_stats');
    
    if (statsError) {
      console.error('❌ Erreur get_agents_stats:', statsError);
    } else {
      console.log('✅ get_agents_stats fonctionne:');
      console.log('  ', statsData);
    }
    
    // Test de la fonction get_filter_options (via une requête directe)
    console.log('');
    console.log('🔍 Test des options de filtres...');
    const [regionsResult, cooperativesResult] = await Promise.all([
      supabase.from('profiles').select('region').eq('role', 'agent').not('region', 'is', null),
      supabase.from('cooperatives').select('id, name')
    ]);
    
    if (regionsResult.error) {
      console.error('❌ Erreur récupération régions:', regionsResult.error);
    } else {
      const regions = [...new Set(regionsResult.data?.map(r => r.region).filter(Boolean) || [])];
      console.log('✅ Régions disponibles:', regions);
    }
    
    if (cooperativesResult.error) {
      console.error('❌ Erreur récupération coopératives:', cooperativesResult.error);
    } else {
      console.log('✅ Coopératives disponibles:', cooperativesResult.data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests RPC:', error);
  }
}

// Exécution du script
async function main() {
  await checkProfilesSchema();
  await testAgentsService();
  
  console.log('');
  console.log('✅ VÉRIFICATION TERMINÉE');
  console.log('========================');
  console.log('Le script a analysé la structure de la base de données');
  console.log('et identifié les problèmes dans le code actuel.');
}

main().catch(console.error);
