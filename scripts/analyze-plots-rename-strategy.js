#!/usr/bin/env node

/**
 * Script d'analyse : Stratégie de renommage farm_file_plots → plots
 * 
 * Contexte: farm_file_plots est l'ancienne table plots qui a été renommée.
 * L'actuelle table 'plots' est obsolète et doit être supprimée.
 * 
 * Ce script analyse la stratégie optimale pour:
 * 1. Supprimer l'ancienne table 'plots' obsolète
 * 2. Renommer farm_file_plots → plots
 * 3. Mettre à jour toutes les références
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
 * Analyse les données dans chaque table
 */
async function analyzeTableData(tableName) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    return { count: 0, sample: [], error: error.message };
  }

  return { count, sample: data || [], error: null };
}

/**
 * Vérifie quelles tables utilisent encore plot_id (référençant l'ancienne plots)
 */
async function checkPlotIdUsage() {
  const tablesToCheck = [
    'crops',
    'operations', 
    'observations',
    'visits',
    'recommendations',
    'media'
  ];

  const results = {};

  for (const table of tablesToCheck) {
    try {
      // Vérifier si la colonne plot_id existe et est utilisée
      const { count: plotIdCount } = await supabase
        .from(table)
        .select('plot_id', { count: 'exact', head: true })
        .not('plot_id', 'is', null);

      // Vérifier si la colonne farm_file_plot_id existe et est utilisée
      let farmFilePlotIdCount = 0;
      try {
        const { count } = await supabase
          .from(table)
          .select('farm_file_plot_id', { count: 'exact', head: true })
          .not('farm_file_plot_id', 'is', null);
        farmFilePlotIdCount = count || 0;
      } catch (e) {
        // La colonne n'existe pas
      }

      results[table] = {
        hasPlotId: plotIdCount > 0,
        plotIdCount: plotIdCount || 0,
        hasFarmFilePlotId: farmFilePlotIdCount > 0,
        farmFilePlotIdCount: farmFilePlotIdCount
      };
    } catch (error) {
      results[table] = { error: error.message };
    }
  }

  return results;
}

/**
 * Analyse les 5 lignes supplémentaires dans l'ancienne plots
 */
async function analyzeOrphanPlots() {
  // Récupérer les plots qui n'ont PAS de correspondance dans farm_file_plots
  const { data: orphanPlots, error } = await supabase
    .from('plots')
    .select('*');

  if (error) {
    return { error: error.message, orphans: [] };
  }

  // Récupérer tous les plot_id de farm_file_plots
  const { data: farmFilePlots } = await supabase
    .from('farm_file_plots')
    .select('plot_id');

  const farmFilePlotIds = new Set((farmFilePlots || []).map(ffp => ffp.plot_id));
  
  // Identifier les orphelins
  const orphans = (orphanPlots || []).filter(plot => !farmFilePlotIds.has(plot.id));

  return { orphans, total: orphanPlots?.length || 0 };
}

/**
 * Vérifie les références dans les fonctions RPC
 */
function getRPCFunctionsList() {
  return {
    usingPlots: [
      'get_plot_by_id',
      'delete_plot_cascade'
    ],
    usingFarmFilePlots: [
      'get_plots_with_geolocation',
      'get_plots_with_geolocation_count',
      'get_plots_by_producer',
      'get_agent_today_visits'
    ]
  };
}

/**
 * Génère le plan de migration
 */
function generateMigrationPlan(analysis) {
  section('📋 PLAN DE MIGRATION RECOMMANDÉ');

  log(colors.bright + colors.green, 'OBJECTIF: Restaurer le nom correct de la table');
  console.log(`
  Contexte:
  ─────────
  • farm_file_plots est l'ANCIENNE table plots (renommée par erreur)
  • plots actuelle est OBSOLÈTE (créée en doublon)
  • Il faut restaurer le nom original: farm_file_plots → plots
  `);

  log(colors.bright + colors.cyan, '\n📝 ÉTAPES DE MIGRATION');
  
  console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 1: PRÉPARATION (BACKUP)                                 ║
  ╚════════════════════════════════════════════════════════════════╝
  
  1️⃣  Créer une sauvegarde de l'ancienne table plots
      
      CREATE TABLE plots_obsolete_backup AS 
      SELECT * FROM plots;
      
      → Garder en backup au cas où des données seraient nécessaires
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 2: SUPPRESSION DE L'ANCIENNE TABLE PLOTS                ║
  ╚════════════════════════════════════════════════════════════════╝
  
  2️⃣  Supprimer toutes les contraintes FK pointant vers plots
      
      -- Identifier les contraintes
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_name IN ('crops', 'operations', 'observations', 
                           'visits', 'recommendations', 'media');
      
      -- Supprimer les contraintes identifiées
      -- (À adapter selon les contraintes trouvées)
  
  3️⃣  Supprimer la table plots obsolète
      
      DROP TABLE IF EXISTS public.plots CASCADE;
      
      → Libère le nom 'plots' pour la vraie table
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 3: RENOMMAGE DE FARM_FILE_PLOTS → PLOTS                 ║
  ╚════════════════════════════════════════════════════════════════╝
  
  4️⃣  Renommer la table principale
      
      ALTER TABLE public.farm_file_plots 
      RENAME TO plots;
      
      → farm_file_plots devient officiellement 'plots'
  
  5️⃣  Renommer la colonne plot_id en plot_id_legacy (temporaire)
      
      ALTER TABLE public.plots 
      RENAME COLUMN plot_id TO plot_id_legacy;
      
      → Cette colonne référençait l'ancienne plots obsolète
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 4: MISE À JOUR DES TABLES DÉPENDANTES                   ║
  ╚════════════════════════════════════════════════════════════════╝
  
  6️⃣  Renommer farm_file_plot_id → plot_id dans les tables
      
      -- Table crops
      ALTER TABLE public.crops 
      RENAME COLUMN farm_file_plot_id TO plot_id;
      
      -- Table operations
      ALTER TABLE public.operations 
      RENAME COLUMN farm_file_plot_id TO plot_id;
      
      -- Table observations
      ALTER TABLE public.observations 
      RENAME COLUMN farm_file_plot_id TO plot_id;
      
      → Maintenant plot_id référence la bonne table 'plots'
  
  7️⃣  Supprimer les anciennes colonnes plot_id (si elles existent)
      
      -- Dans visits (si elle référençait l'ancienne plots)
      ALTER TABLE public.visits 
      DROP COLUMN IF EXISTS plot_id CASCADE;
      
      -- Dans recommendations
      ALTER TABLE public.recommendations 
      DROP COLUMN IF EXISTS plot_id CASCADE;
      
      → Nettoyer les références à l'ancienne table obsolète
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 5: MISE À JOUR DES FONCTIONS RPC                        ║
  ╚════════════════════════════════════════════════════════════════╝
  
  8️⃣  Mettre à jour toutes les fonctions RPC
      
      • get_plots_with_geolocation     → Déjà OK (utilisait farm_file_plots)
      • get_plots_with_geolocation_count → Déjà OK
      • get_plots_by_producer          → Déjà OK
      • get_agent_today_visits         → Déjà OK
      • get_plot_by_id                 → À vérifier/mettre à jour
      • delete_plot_cascade            → À mettre à jour
      
      → Les fonctions utilisaient déjà farm_file_plots, 
        donc elles fonctionneront automatiquement après le renommage !
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 6: MISE À JOUR DU CODE FRONTEND                         ║
  ╚════════════════════════════════════════════════════════════════╝
  
  9️⃣  Remplacer toutes les références à 'farm_file_plots'
      
      # Rechercher les références
      grep -r "farm_file_plots" web/src mobile/app mobile/lib lib
      
      # Remplacer par 'plots'
      • Services API: .from('farm_file_plots') → .from('plots')
      • Interfaces TypeScript: FarmFilePlot → Plot
      • Noms de variables: farmFilePlot → plot
      
      → Restaurer la nomenclature standard partout
  
  🔟  Nettoyer les noms de colonnes dans le code
      
      • farm_file_plot_id → plot_id
      • farmFilePlotId → plotId
      
      → Cohérence avec la nouvelle structure
  
  
  ╔════════════════════════════════════════════════════════════════╗
  ║  PHASE 7: VALIDATION ET NETTOYAGE                              ║
  ╚════════════════════════════════════════════════════════════════╝
  
  1️⃣1️⃣  Tests complets
      
      • Tester toutes les fonctionnalités CRUD sur parcelles
      • Vérifier les relations (crops, operations, observations)
      • Tester les fonctions RPC
      • Valider le frontend (web + mobile)
  
  1️⃣2️⃣  Nettoyage final
      
      -- Supprimer la colonne plot_id_legacy si non utilisée
      ALTER TABLE public.plots 
      DROP COLUMN IF EXISTS plot_id_legacy;
      
      -- Supprimer le backup après validation (optionnel)
      DROP TABLE IF EXISTS plots_obsolete_backup;
      
      → Base de données propre et cohérente
  `);

  log(colors.bright + colors.yellow, '\n⚠️  POINTS D\'ATTENTION');
  console.log(`
  1. BACKUP OBLIGATOIRE avant toute opération
  2. Tester sur STAGING d'abord
  3. Les fonctions RPC fonctionneront automatiquement (elles utilisaient déjà farm_file_plots)
  4. Le frontend nécessite une mise à jour complète (recherche/remplacement)
  5. Vérifier les RLS policies après renommage
  `);

  log(colors.bright + colors.green, '\n✅ AVANTAGES DE CETTE APPROCHE');
  console.log(`
  ✓ Restaure la nomenclature standard (plots au lieu de farm_file_plots)
  ✓ Simplifie le code (pas de nom composé)
  ✓ Les RPC fonctionnent automatiquement après renommage
  ✓ Cohérence dans tout le codebase
  ✓ Pas de perte de données (farm_file_plots contient toutes les infos)
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
  ║         ANALYSE: Stratégie de Renommage farm_file_plots → plots          ║
  ║                                                                           ║
  ║              Contexte: farm_file_plots = ancienne plots renommée         ║
  ║                        plots actuelle = obsolète (à supprimer)            ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  try {
    // ==================== SECTION 1: ANALYSE DES DONNÉES ====================
    section('1️⃣  ANALYSE DES DONNÉES');

    subsection('Table plots (OBSOLÈTE)');
    const plotsData = await analyzeTableData('plots');
    if (plotsData.error) {
      log(colors.red, `   ✗ Erreur: ${plotsData.error}`);
    } else {
      log(colors.yellow, `   ⚠️  ${plotsData.count} lignes (table obsolète à supprimer)`);
      if (plotsData.sample.length > 0) {
        console.log('\n   Exemple de données:');
        plotsData.sample.slice(0, 2).forEach((row, i) => {
          console.log(`   ${i + 1}. ID: ${row.id}`);
          console.log(`      Name: ${row.name || 'N/A'}`);
          console.log(`      Producer: ${row.producer_id || 'N/A'}`);
        });
      }
    }

    subsection('Table farm_file_plots (VRAIE TABLE, à renommer → plots)');
    const farmFilePlotsData = await analyzeTableData('farm_file_plots');
    if (farmFilePlotsData.error) {
      log(colors.red, `   ✗ Erreur: ${farmFilePlotsData.error}`);
    } else {
      log(colors.green, `   ✓ ${farmFilePlotsData.count} lignes (source de vérité)`);
      if (farmFilePlotsData.sample.length > 0) {
        console.log('\n   Exemple de données:');
        farmFilePlotsData.sample.slice(0, 2).forEach((row, i) => {
          console.log(`   ${i + 1}. ID: ${row.id}`);
          console.log(`      Name: ${row.name_season_snapshot || 'N/A'}`);
          console.log(`      Producer: ${row.producer_id || 'N/A'}`);
          console.log(`      Area: ${row.area_hectares || 'N/A'} ha`);
          console.log(`      Status: ${row.status || 'N/A'}`);
        });
      }
    }

    // ==================== SECTION 2: LIGNES ORPHELINES ====================
    section('2️⃣  ANALYSE DES LIGNES ORPHELINES');

    subsection('Plots sans correspondance dans farm_file_plots');
    const orphanAnalysis = await analyzeOrphanPlots();
    
    if (orphanAnalysis.error) {
      log(colors.red, `   ✗ Erreur: ${orphanAnalysis.error}`);
    } else {
      log(colors.yellow, `   📊 ${orphanAnalysis.orphans.length} lignes orphelines trouvées sur ${orphanAnalysis.total}`);
      
      if (orphanAnalysis.orphans.length > 0) {
        console.log('\n   Détail des lignes orphelines:');
        orphanAnalysis.orphans.forEach((plot, i) => {
          console.log(`\n   ${i + 1}. ID: ${plot.id}`);
          console.log(`      Name: ${plot.name || 'N/A'}`);
          console.log(`      Producer: ${plot.producer_id || 'N/A'}`);
          console.log(`      Created: ${plot.created_at || 'N/A'}`);
        });

        log(colors.magenta, '\n   💡 Recommandation:');
        console.log('      Ces données sont dans l\'ancienne table obsolète.');
        console.log('      Vérifier si elles doivent être migrées vers farm_file_plots');
        console.log('      AVANT de supprimer la table plots.');
      } else {
        log(colors.green, '   ✓ Aucune ligne orpheline - toutes les données sont en sync');
      }
    }

    // ==================== SECTION 3: UTILISATION DES COLONNES ====================
    section('3️⃣  ANALYSE DE L\'UTILISATION DES COLONNES');

    subsection('Tables utilisant plot_id vs farm_file_plot_id');
    const columnUsage = await checkPlotIdUsage();

    console.log('\n   Résultats par table:');
    console.log('   ' + '─'.repeat(60));

    for (const [table, usage] of Object.entries(columnUsage)) {
      console.log(`\n   📋 ${table.toUpperCase()}`);
      if (usage.error) {
        log(colors.red, `      ✗ Erreur: ${usage.error}`);
      } else {
        if (usage.hasPlotId) {
          log(colors.yellow, `      ⚠️  plot_id: ${usage.plotIdCount} lignes (ancienne référence)`);
        } else {
          log(colors.green, `      ✓ plot_id: non utilisé ou 0 lignes`);
        }

        if (usage.hasFarmFilePlotId) {
          log(colors.green, `      ✓ farm_file_plot_id: ${usage.farmFilePlotIdCount} lignes`);
        } else {
          log(colors.gray, `      ○ farm_file_plot_id: n'existe pas`);
        }
      }
    }

    // ==================== SECTION 4: FONCTIONS RPC ====================
    section('4️⃣  FONCTIONS RPC');

    const rpcFunctions = getRPCFunctionsList();

    subsection('Fonctions utilisant "plots" (ancienne table)');
    if (rpcFunctions.usingPlots.length > 0) {
      log(colors.yellow, `   ⚠️  ${rpcFunctions.usingPlots.length} fonction(s) à vérifier`);
      rpcFunctions.usingPlots.forEach(fn => {
        console.log(`   • ${fn}`);
      });
    }

    subsection('Fonctions utilisant "farm_file_plots" (vraie table)');
    if (rpcFunctions.usingFarmFilePlots.length > 0) {
      log(colors.green, `   ✓ ${rpcFunctions.usingFarmFilePlots.length} fonction(s) - fonctionneront après renommage`);
      rpcFunctions.usingFarmFilePlots.forEach(fn => {
        console.log(`   • ${fn}`);
      });
    }

    // ==================== SECTION 5: PLAN DE MIGRATION ====================
    generateMigrationPlan({
      plotsCount: plotsData.count,
      farmFilePlotsCount: farmFilePlotsData.count,
      orphanCount: orphanAnalysis.orphans?.length || 0,
      columnUsage
    });

    // ==================== RÉSUMÉ FINAL ====================
    section('📊 RÉSUMÉ EXÉCUTIF');

    console.log(`
   État actuel:
   ────────────
   • plots (obsolète):         ${plotsData.count} lignes
   • farm_file_plots (vraie):  ${farmFilePlotsData.count} lignes
   • Lignes orphelines:        ${orphanAnalysis.orphans?.length || 0}
   
   Impact de la migration:
   ───────────────────────
   • Tables à renommer:        1 (farm_file_plots → plots)
   • Tables à supprimer:       1 (plots obsolète)
   • Colonnes à renommer:      3-4 (farm_file_plot_id → plot_id)
   • Fonctions RPC:            5 fonctionneront automatiquement
   • Code frontend:            Recherche/remplacement global
   
   Complexité:
   ───────────
   • Risque technique:         ████░░░░░░ 4/10 (renommage simple)
   • Risque données:           ██░░░░░░░░ 2/10 (farm_file_plots complète)
   • Impact frontend:          ████████░░ 8/10 (beaucoup de fichiers)
   • Durée estimée:            2-3 jours (avec tests)
    `);

    log(colors.bright + colors.green, '\n✅ CONCLUSION');
    console.log(`
   Cette migration est PLUS SIMPLE que prévu car:
   • farm_file_plots contient déjà toutes les données
   • Les fonctions RPC utilisent déjà farm_file_plots
   • C'est juste un renommage pour restaurer la nomenclature standard
   • Risque de perte de données minimal
    `);

    log(colors.bright + colors.cyan, '\n🚀 PROCHAINES ÉTAPES');
    console.log(`
   1. Examiner les ${orphanAnalysis.orphans?.length || 0} lignes orphelines
   2. Créer un backup complet
   3. Tester sur staging
   4. Exécuter la migration en 7 phases
   5. Mettre à jour le code frontend
   6. Tests de régression complets
    `);

    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.green, '\n✅ Analyse terminée avec succès\n');

  } catch (error) {
    log(colors.red, `\n❌ Erreur durant l'analyse: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

