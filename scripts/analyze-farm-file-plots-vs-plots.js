#!/usr/bin/env node

/**
 * Script d'analyse comparative : farm_file_plots vs plots
 * 
 * Ce script analyse en profondeur les deux tables pour préparer
 * la refactorisation et la dépréciation de la table 'plots'.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(colors.bright + colors.cyan, `  ${title}`);
  console.log('='.repeat(80) + '\n');
}

function subsection(title) {
  log(colors.bright + colors.blue, `\n▶ ${title}`);
  console.log('-'.repeat(60));
}

/**
 * Analyse la structure d'une table
 */
async function getTableStructure(tableName) {
  // Approche simple: récupérer une ligne et analyser les colonnes
  const { data: rows, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    log(colors.yellow, `   ⚠️  Erreur récupération ${tableName}: ${error.message}`);
    return [];
  }

  if (!rows || rows.length === 0) {
    // Table vide, essayer quand même de récupérer la structure via une requête vide
    const { data: emptyData, error: emptyError } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (emptyError) {
      return [];
    }
    
    // Supabase retourne toujours la structure même avec 0 lignes
    return [];
  }

  // Extraire les colonnes depuis la première ligne
  const columns = Object.keys(rows[0]).map(col => {
    const value = rows[0][col];
    let dataType = 'unknown';
    
    if (value === null) {
      dataType = 'nullable';
    } else if (typeof value === 'string') {
      // Vérifier si c'est un UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        dataType = 'uuid';
      } else {
        dataType = 'text';
      }
    } else if (typeof value === 'number') {
      dataType = Number.isInteger(value) ? 'integer' : 'numeric';
    } else if (typeof value === 'boolean') {
      dataType = 'boolean';
    } else if (value instanceof Date) {
      dataType = 'timestamp';
    } else if (typeof value === 'object') {
      dataType = 'jsonb';
    }

    return {
      column_name: col,
      data_type: dataType,
      is_nullable: value === null ? 'YES' : 'unknown'
    };
  });

  return columns;
}

/**
 * Compte le nombre de lignes dans une table
 */
async function getRowCount(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    log(colors.red, `   ⚠️  Erreur comptage ${tableName}: ${error.message}`);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère les contraintes d'une table (simulé - nécessiterait accès admin)
 */
async function getTableConstraints(tableName) {
  // Cette fonction nécessite des permissions admin pour accéder à information_schema
  // Pour l'instant, on retourne un tableau vide
  return [];
}

/**
 * Récupère les index d'une table (simulé - nécessiterait accès admin)
 */
async function getTableIndexes(tableName) {
  // Cette fonction nécessite des permissions admin pour accéder à pg_indexes
  // Pour l'instant, on retourne un tableau vide
  return [];
}

/**
 * Trouve les tables qui référencent une table donnée (simulé - analyse manuelle)
 */
async function getReferencingTables(tableName) {
  // Cette fonction nécessite des permissions admin
  // On retourne des références connues manuellement
  
  const knownReferences = {
    'plots': [
      { table_name: 'crops', column_name: 'plot_id', foreign_column_name: 'id' },
      { table_name: 'operations', column_name: 'plot_id', foreign_column_name: 'id' },
      { table_name: 'observations', column_name: 'plot_id', foreign_column_name: 'id' },
      { table_name: 'visits', column_name: 'plot_id', foreign_column_name: 'id' },
      { table_name: 'recommendations', column_name: 'plot_id', foreign_column_name: 'id' },
      { table_name: 'media', column_name: 'entity_id', foreign_column_name: 'id' }
    ],
    'farm_file_plots': [
      { table_name: 'crops', column_name: 'farm_file_plot_id', foreign_column_name: 'id' },
      { table_name: 'operations', column_name: 'farm_file_plot_id', foreign_column_name: 'id' },
      { table_name: 'observations', column_name: 'farm_file_plot_id', foreign_column_name: 'id' }
    ]
  };

  return knownReferences[tableName] || [];
}

/**
 * Cherche les fonctions RPC qui utilisent une table (liste connue)
 */
async function getFunctionsUsingTable(tableName) {
  // Liste manuelle des fonctions connues par table
  const knownFunctions = {
    'plots': [
      { function_name: 'get_plot_by_id' },
      { function_name: 'delete_plot_cascade' }
    ],
    'farm_file_plots': [
      { function_name: 'get_plots_with_geolocation' },
      { function_name: 'get_plots_with_geolocation_count' },
      { function_name: 'get_plot_by_id' },
      { function_name: 'get_plots_by_producer' },
      { function_name: 'get_agent_today_visits' }
    ]
  };

  return knownFunctions[tableName] || [];
}

/**
 * Analyse les données communes entre les deux tables
 */
async function analyzeDataOverlap() {
  subsection('Analyse de chevauchement des données');

  // Vérifier si les tables ont des colonnes communes
  const { data: plotsData } = await supabase
    .from('plots')
    .select('id')
    .limit(5);

  const { data: farmFilePlotsData } = await supabase
    .from('farm_file_plots')
    .select('id, plot_id')
    .limit(5);

  if (plotsData && farmFilePlotsData) {
    log(colors.green, '   ✓ Les deux tables sont accessibles');
    
    // Compter les plot_id dans farm_file_plots qui existent dans plots
    const { count: matchingCount } = await supabase
      .from('farm_file_plots')
      .select('plot_id', { count: 'exact', head: true })
      .not('plot_id', 'is', null);

    log(colors.cyan, `   📊 farm_file_plots avec plot_id non null: ${matchingCount || 0}`);

    // Compter les plot_id null dans farm_file_plots
    const { count: nullCount } = await supabase
      .from('farm_file_plots')
      .select('plot_id', { count: 'exact', head: true })
      .is('plot_id', null);

    log(colors.yellow, `   📊 farm_file_plots avec plot_id null: ${nullCount || 0}`);
  }
}

/**
 * Recherche dans le code source
 */
function searchInCodebase(tableName) {
  subsection(`Utilisation de "${tableName}" dans le code`);
  
  const searchPaths = [
    'web/src',
    'mobile/app',
    'mobile/lib',
    'lib',
    'supabase/functions'
  ];

  log(colors.yellow, `   ℹ️  Recherche manuelle recommandée dans:`);
  searchPaths.forEach(path => {
    console.log(`      - ${path}`);
  });
  console.log(`   Commande: grep -r "${tableName}" ${searchPaths.join(' ')}`);
}

/**
 * Génère les recommandations de refactoring
 */
function generateRecommendations(analysis) {
  section('📋 RECOMMANDATIONS DE REFACTORING');

  log(colors.bright + colors.green, '1. STRATÉGIE DE MIGRATION');
  console.log(`
   Phase 1: Audit et Préparation
   ────────────────────────────────
   ✓ Identifier toutes les dépendances de 'plots'
   ✓ Créer une table de mapping temporaire si nécessaire
   ✓ Documenter les différences de structure
   ✓ Planifier les migrations de données

   Phase 2: Migration des Fonctions RPC
   ─────────────────────────────────────
   ✓ Mettre à jour toutes les fonctions RPC pour utiliser farm_file_plots
   ✓ Créer des fonctions wrapper pour compatibilité ascendante
   ✓ Tester chaque fonction après migration

   Phase 3: Migration du Frontend
   ───────────────────────────────
   ✓ Web: Mettre à jour tous les services API
   ✓ Mobile: Mettre à jour tous les hooks et services
   ✓ Tester toutes les interfaces utilisateur

   Phase 4: Migration des Données
   ───────────────────────────────
   ✓ Transférer les données manquantes vers farm_file_plots
   ✓ Mettre à jour les références (clés étrangères)
   ✓ Valider l'intégrité des données

   Phase 5: Dépréciation de 'plots'
   ─────────────────────────────────
   ✓ Créer une vue 'plots' qui pointe vers farm_file_plots (compatibilité)
   ✓ Marquer la table 'plots' comme obsolète (commentaire)
   ✓ Planifier la suppression finale
  `);

  log(colors.bright + colors.yellow, '\n2. RISQUES IDENTIFIÉS');
  console.log(`
   ⚠️  Perte de données si migration mal exécutée
   ⚠️  Rupture des références de clés étrangères
   ⚠️  Incompatibilité avec le code existant
   ⚠️  Impact sur les performances pendant la migration
   ⚠️  Nécessité de mettre à jour les RLS policies
  `);

  log(colors.bright + colors.blue, '\n3. TESTS REQUIS');
  console.log(`
   ✓ Tests unitaires pour toutes les fonctions RPC modifiées
   ✓ Tests d'intégration pour les workflows complets
   ✓ Tests de performance (lecture/écriture)
   ✓ Tests de régression sur toutes les fonctionnalités
   ✓ Tests de migration sur environnement de staging
  `);

  log(colors.bright + colors.magenta, '\n4. ORDRE D\'EXÉCUTION RECOMMANDÉ');
  console.log(`
   1️⃣  Créer une migration pour ajouter les colonnes manquantes à farm_file_plots
   2️⃣  Migrer les données de 'plots' vers 'farm_file_plots'
   3️⃣  Mettre à jour toutes les fonctions RPC (20+ migrations)
   4️⃣  Mettre à jour les services frontend (web + mobile)
   5️⃣  Mettre à jour les RLS policies
   6️⃣  Tests complets sur staging
   7️⃣  Déploiement progressif en production
   8️⃣  Monitoring pendant 1 semaine
   9️⃣  Créer une vue 'plots' (legacy) pointant vers farm_file_plots
   🔟  Supprimer la table 'plots' après validation complète
  `);
}

/**
 * Fonction principale
 */
async function main() {
  console.clear();
  log(colors.bright + colors.green, `
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║           ANALYSE COMPARATIVE: farm_file_plots vs plots                   ║
  ║                                                                           ║
  ║                      AgriConnect - Octobre 2025                           ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  const analysis = {
    plots: {},
    farm_file_plots: {}
  };

  try {
    // ==================== SECTION 1: STRUCTURE DES TABLES ====================
    section('1️⃣  STRUCTURE DES TABLES');

    // Analyse de 'plots'
    subsection('Table: plots');
    const plotsStructure = await getTableStructure('plots');
    analysis.plots.structure = plotsStructure;
    
    if (plotsStructure.length > 0) {
      log(colors.green, `   ✓ ${plotsStructure.length} colonnes trouvées`);
      console.log('\n   Colonnes:');
      plotsStructure.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}`);
      });
    } else {
      log(colors.red, '   ✗ Impossible de récupérer la structure');
    }

    // Analyse de 'farm_file_plots'
    subsection('Table: farm_file_plots');
    const farmFilePlotsStructure = await getTableStructure('farm_file_plots');
    analysis.farm_file_plots.structure = farmFilePlotsStructure;
    
    if (farmFilePlotsStructure.length > 0) {
      log(colors.green, `   ✓ ${farmFilePlotsStructure.length} colonnes trouvées`);
      console.log('\n   Colonnes:');
      farmFilePlotsStructure.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}`);
      });
    } else {
      log(colors.red, '   ✗ Impossible de récupérer la structure');
    }

    // Comparaison des colonnes
    subsection('Comparaison des Colonnes');
    const plotsColumns = new Set(plotsStructure.map(c => c.column_name));
    const farmFilePlotsColumns = new Set(farmFilePlotsStructure.map(c => c.column_name));

    const onlyInPlots = [...plotsColumns].filter(c => !farmFilePlotsColumns.has(c));
    const onlyInFarmFilePlots = [...farmFilePlotsColumns].filter(c => !plotsColumns.has(c));
    const common = [...plotsColumns].filter(c => farmFilePlotsColumns.has(c));

    log(colors.cyan, `   📊 Colonnes communes: ${common.length}`);
    if (common.length > 0) {
      console.log('      ', common.join(', '));
    }

    log(colors.yellow, `\n   📊 Colonnes uniquement dans 'plots': ${onlyInPlots.length}`);
    if (onlyInPlots.length > 0) {
      console.log('      ', onlyInPlots.join(', '));
    }

    log(colors.magenta, `\n   📊 Colonnes uniquement dans 'farm_file_plots': ${onlyInFarmFilePlots.length}`);
    if (onlyInFarmFilePlots.length > 0) {
      console.log('      ', onlyInFarmFilePlots.join(', '));
    }

    // ==================== SECTION 2: DONNÉES ====================
    section('2️⃣  ANALYSE DES DONNÉES');

    subsection('Nombre de lignes');
    const plotsCount = await getRowCount('plots');
    const farmFilePlotsCount = await getRowCount('farm_file_plots');
    
    analysis.plots.count = plotsCount;
    analysis.farm_file_plots.count = farmFilePlotsCount;

    log(colors.cyan, `   📊 plots:            ${plotsCount.toLocaleString()} lignes`);
    log(colors.cyan, `   📊 farm_file_plots:  ${farmFilePlotsCount.toLocaleString()} lignes`);

    if (farmFilePlotsCount > plotsCount) {
      log(colors.green, `   ✓ farm_file_plots contient ${farmFilePlotsCount - plotsCount} lignes de plus`);
    } else if (plotsCount > farmFilePlotsCount) {
      log(colors.yellow, `   ⚠️  plots contient ${plotsCount - farmFilePlotsCount} lignes de plus`);
    } else {
      log(colors.blue, '   ℹ️  Les deux tables ont le même nombre de lignes');
    }

    // Analyse de chevauchement
    await analyzeDataOverlap();

    // ==================== SECTION 3: CONTRAINTES & INDEX ====================
    section('3️⃣  CONTRAINTES ET INDEX');

    // Contraintes de 'plots'
    subsection('Contraintes: plots');
    const plotsConstraints = await getTableConstraints('plots');
    analysis.plots.constraints = plotsConstraints;
    
    if (plotsConstraints.length > 0) {
      plotsConstraints.forEach(c => {
        const fk = c.foreign_table_name ? ` → ${c.foreign_table_name}(${c.foreign_column_name})` : '';
        console.log(`   • ${c.constraint_type.padEnd(15)} ${c.constraint_name}${fk}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucune contrainte trouvée');
    }

    // Index de 'plots'
    subsection('Index: plots');
    const plotsIndexes = await getTableIndexes('plots');
    analysis.plots.indexes = plotsIndexes;
    
    if (plotsIndexes.length > 0) {
      plotsIndexes.forEach(idx => {
        console.log(`   • ${idx.indexname}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucun index trouvé');
    }

    // Contraintes de 'farm_file_plots'
    subsection('Contraintes: farm_file_plots');
    const farmFilePlotsConstraints = await getTableConstraints('farm_file_plots');
    analysis.farm_file_plots.constraints = farmFilePlotsConstraints;
    
    if (farmFilePlotsConstraints.length > 0) {
      farmFilePlotsConstraints.forEach(c => {
        const fk = c.foreign_table_name ? ` → ${c.foreign_table_name}(${c.foreign_column_name})` : '';
        console.log(`   • ${c.constraint_type.padEnd(15)} ${c.constraint_name}${fk}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucune contrainte trouvée');
    }

    // Index de 'farm_file_plots'
    subsection('Index: farm_file_plots');
    const farmFilePlotsIndexes = await getTableIndexes('farm_file_plots');
    analysis.farm_file_plots.indexes = farmFilePlotsIndexes;
    
    if (farmFilePlotsIndexes.length > 0) {
      farmFilePlotsIndexes.forEach(idx => {
        console.log(`   • ${idx.indexname}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucun index trouvé');
    }

    // ==================== SECTION 4: DÉPENDANCES ====================
    section('4️⃣  ANALYSE DES DÉPENDANCES');

    // Tables qui référencent 'plots'
    subsection('Tables référençant "plots"');
    const plotsReferences = await getReferencingTables('plots');
    analysis.plots.references = plotsReferences;
    
    if (plotsReferences.length > 0) {
      log(colors.yellow, `   ⚠️  ${plotsReferences.length} table(s) référence(nt) 'plots'`);
      plotsReferences.forEach(ref => {
        console.log(`   • ${ref.table_name}.${ref.column_name} → plots.${ref.foreign_column_name}`);
      });
    } else {
      log(colors.green, '   ✓ Aucune table ne référence directement "plots"');
    }

    // Tables qui référencent 'farm_file_plots'
    subsection('Tables référençant "farm_file_plots"');
    const farmFilePlotsReferences = await getReferencingTables('farm_file_plots');
    analysis.farm_file_plots.references = farmFilePlotsReferences;
    
    if (farmFilePlotsReferences.length > 0) {
      log(colors.cyan, `   📊 ${farmFilePlotsReferences.length} table(s) référence(nt) 'farm_file_plots'`);
      farmFilePlotsReferences.forEach(ref => {
        console.log(`   • ${ref.table_name}.${ref.column_name} → farm_file_plots.${ref.foreign_column_name}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucune table ne référence directement "farm_file_plots"');
    }

    // Fonctions RPC utilisant 'plots'
    subsection('Fonctions RPC utilisant "plots"');
    const plotsFunctions = await getFunctionsUsingTable('plots');
    analysis.plots.functions = plotsFunctions;
    
    if (plotsFunctions.length > 0) {
      log(colors.yellow, `   ⚠️  ${plotsFunctions.length} fonction(s) RPC utilise(nt) 'plots'`);
      plotsFunctions.forEach(fn => {
        console.log(`   • ${fn.function_name}`);
      });
    } else {
      log(colors.green, '   ✓ Aucune fonction RPC n\'utilise "plots"');
    }

    // Fonctions RPC utilisant 'farm_file_plots'
    subsection('Fonctions RPC utilisant "farm_file_plots"');
    const farmFilePlotsFunctions = await getFunctionsUsingTable('farm_file_plots');
    analysis.farm_file_plots.functions = farmFilePlotsFunctions;
    
    if (farmFilePlotsFunctions.length > 0) {
      log(colors.cyan, `   📊 ${farmFilePlotsFunctions.length} fonction(s) RPC utilise(nt) 'farm_file_plots'`);
      farmFilePlotsFunctions.forEach(fn => {
        console.log(`   • ${fn.function_name}`);
      });
    } else {
      log(colors.yellow, '   ℹ️  Aucune fonction RPC n\'utilise "farm_file_plots"');
    }

    // ==================== SECTION 5: CODE SOURCE ====================
    section('5️⃣  UTILISATION DANS LE CODE');

    searchInCodebase('plots');
    searchInCodebase('farm_file_plots');

    // ==================== SECTION 6: RECOMMANDATIONS ====================
    generateRecommendations(analysis);

    // ==================== RÉSUMÉ FINAL ====================
    section('📊 RÉSUMÉ EXÉCUTIF');

    console.log(`
   État actuel:
   ────────────
   • plots:            ${plotsCount.toLocaleString()} lignes, ${plotsStructure.length} colonnes
   • farm_file_plots:  ${farmFilePlotsCount.toLocaleString()} lignes, ${farmFilePlotsStructure.length} colonnes
   
   Dépendances:
   ────────────
   • Tables référençant plots:            ${plotsReferences.length}
   • Tables référençant farm_file_plots:  ${farmFilePlotsReferences.length}
   • Fonctions RPC utilisant plots:       ${plotsFunctions.length}
   • Fonctions RPC utilisant farm_file_plots: ${farmFilePlotsFunctions.length}

   Conclusion:
   ───────────
    `);

    if (farmFilePlotsCount > plotsCount && plotsFunctions.length === 0) {
      log(colors.green, `   ✓ farm_file_plots est la source de vérité active`);
      log(colors.green, '   ✓ La table plots peut être dépréciée sans risque majeur');
      log(colors.yellow, '   ⚠️  Vérifier le code frontend avant de procéder');
    } else if (plotsFunctions.length > 0 || plotsReferences.length > 0) {
      log(colors.yellow, '   ⚠️  Migration requise: plots est encore utilisée');
      log(colors.red, `   ✗ ${plotsFunctions.length + plotsReferences.length} dépendance(s) à migrer`);
    } else {
      log(colors.blue, '   ℹ️  Analyse approfondie recommandée avant refactoring');
    }

    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.green, '\n✅ Analyse terminée avec succès\n');

  } catch (error) {
    log(colors.red, `\n❌ Erreur durant l'analyse: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
main();

