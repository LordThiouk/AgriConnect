#!/usr/bin/env node

/**
 * Script de vérification : Analyse des lignes orphelines de plots
 * 
 * Ce script vérifie quelles données des 14 lignes orphelines existent déjà
 * dans farm_file_plots et prépare la migration pour celles qui doivent être sauvegardées.
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

/**
 * Récupère les lignes orphelines
 */
async function getOrphanPlots() {
  const { data: allPlots, error: plotsError } = await supabase
    .from('plots')
    .select('*');

  if (plotsError) {
    throw new Error(`Erreur récupération plots: ${plotsError.message}`);
  }

  const { data: farmFilePlots, error: ffpError } = await supabase
    .from('farm_file_plots')
    .select('plot_id, id, name_season_snapshot, producer_id, area_hectares, status');

  if (ffpError) {
    throw new Error(`Erreur récupération farm_file_plots: ${ffpError.message}`);
  }

  const farmFilePlotIds = new Set(farmFilePlots.map(ffp => ffp.plot_id));
  const orphans = allPlots.filter(plot => !farmFilePlotIds.has(plot.id));

  return { orphans, farmFilePlots, allPlots };
}

/**
 * Vérifie si une parcelle orpheline existe déjà dans farm_file_plots par d'autres critères
 */
function findMatchingFarmFilePlot(orphan, farmFilePlots) {
  // Chercher par producer_id et nom similaire
  const potentialMatches = farmFilePlots.filter(ffp => {
    // Même producteur
    if (ffp.producer_id !== orphan.producer_id) return false;
    
    // Nom similaire (ignorer la casse et les espaces)
    const orphanName = (orphan.name || '').toLowerCase().trim();
    const ffpName = (ffp.name_season_snapshot || '').toLowerCase().trim();
    
    // Match exact
    if (orphanName === ffpName) return true;
    
    // Match partiel (contient)
    if (orphanName && ffpName && (
      ffpName.includes(orphanName) || 
      orphanName.includes(ffpName)
    )) return true;
    
    return false;
  });

  return potentialMatches;
}

/**
 * Analyse les lignes orphelines
 */
async function analyzeOrphans() {
  const { orphans, farmFilePlots } = await getOrphanPlots();

  log(colors.bright + colors.cyan, `\n📊 ANALYSE DES ${orphans.length} LIGNES ORPHELINES\n`);

  const analysis = {
    testData: [],           // Données de test (producer_id = null)
    hasMatch: [],           // A des correspondances dans farm_file_plots
    noMatch: [],            // Pas de correspondance, à migrer
    toMigrate: []           // Liste finale à migrer
  };

  orphans.forEach(orphan => {
    console.log('\n' + '-'.repeat(60));
    log(colors.bright, `Parcelle: ${orphan.name || 'Sans nom'}`);
    console.log(`ID: ${orphan.id}`);
    console.log(`Producer ID: ${orphan.producer_id || 'NULL'}`);
    console.log(`Created: ${orphan.created_at}`);

    // Vérifier si c'est une donnée de test
    if (!orphan.producer_id) {
      log(colors.yellow, '⚠️  Donnée de test (producer_id = NULL)');
      analysis.testData.push(orphan);
      return;
    }

    // Chercher des correspondances
    const matches = findMatchingFarmFilePlot(orphan, farmFilePlots);

    if (matches.length > 0) {
      log(colors.green, `✓ ${matches.length} correspondance(s) trouvée(s) dans farm_file_plots`);
      matches.forEach(match => {
        console.log(`  → ${match.name_season_snapshot} (${match.area_hectares || 'N/A'} ha)`);
      });
      analysis.hasMatch.push({ orphan, matches });
    } else {
      log(colors.red, '✗ Aucune correspondance - À MIGRER');
      analysis.noMatch.push(orphan);
      analysis.toMigrate.push(orphan);
    }
  });

  return analysis;
}

/**
 * Génère le SQL de migration
 */
function generateMigrationSQL(toMigrate) {
  if (toMigrate.length === 0) {
    log(colors.green, '\n✅ Aucune migration nécessaire - toutes les parcelles existent déjà');
    return null;
  }

  section('📝 SQL DE MIGRATION');

  log(colors.yellow, `${toMigrate.length} parcelle(s) à migrer vers farm_file_plots\n`);

  let sql = `-- Migration des parcelles orphelines de plots vers farm_file_plots
-- Date: ${new Date().toISOString()}
-- Nombre de parcelles: ${toMigrate.length}

`;

  toMigrate.forEach((plot, index) => {
    sql += `
-- Parcelle ${index + 1}: ${plot.name || 'Sans nom'}
INSERT INTO public.farm_file_plots (
  id,
  producer_id,
  cooperative_id,
  name_season_snapshot,
  area_hectares,
  soil_type,
  water_source,
  status,
  geom,
  center_point,
  plot_id,
  created_at,
  updated_at,
  farm_file_id
)
VALUES (
  gen_random_uuid(),                                    -- Nouvel ID
  ${plot.producer_id ? `'${plot.producer_id}'` : 'NULL'},  -- producer_id
  ${plot.cooperative_id ? `'${plot.cooperative_id}'` : 'NULL'},  -- cooperative_id
  '${(plot.name || 'Parcelle migrée').replace(/'/g, "''")}',  -- name_season_snapshot
  ${plot.area_hectares || 0.5},                        -- area_hectares (défaut)
  'unknown',                                            -- soil_type (défaut)
  'unknown',                                            -- water_source (défaut)
  'active',                                             -- status (défaut)
  ${plot.geom ? `'${JSON.stringify(plot.geom)}'::jsonb` : 'NULL'},  -- geom
  ${plot.geom ? `ST_Centroid(ST_GeomFromGeoJSON('${JSON.stringify(plot.geom)}'))` : 'NULL'},  -- center_point
  '${plot.id}',                                         -- plot_id (référence ancienne plots)
  '${plot.created_at}',                                 -- created_at
  '${plot.updated_at || plot.created_at}',             -- updated_at
  (SELECT id FROM public.farm_files WHERE producer_id = ${plot.producer_id ? `'${plot.producer_id}'` : 'NULL'} LIMIT 1)  -- farm_file_id
);
`;
  });

  sql += `
-- Vérification après migration
SELECT 
  'Migration terminée' as status,
  COUNT(*) as parcelles_migrees
FROM public.farm_file_plots
WHERE plot_id IN (${toMigrate.map(p => `'${p.id}'`).join(', ')});
`;

  return sql;
}

/**
 * Affiche le résumé
 */
function displaySummary(analysis) {
  section('📊 RÉSUMÉ DE L\'ANALYSE');

  console.log(`
┌──────────────────────────────────────────────────────────┐
│  CATÉGORIES DES LIGNES ORPHELINES                        │
├──────────────────────────────────────────────────────────┤
│  Données de test (à ignorer):        ${analysis.testData.length.toString().padStart(2)} lignes    │
│  Correspondances trouvées:           ${analysis.hasMatch.length.toString().padStart(2)} lignes    │
│  Sans correspondance (à migrer):     ${analysis.noMatch.length.toString().padStart(2)} lignes    │
└──────────────────────────────────────────────────────────┘
  `);

  if (analysis.testData.length > 0) {
    log(colors.yellow, '\n⚠️  Données de test (producer_id = NULL)');
    console.log('Ces données peuvent être supprimées sans problème:\n');
    analysis.testData.forEach(plot => {
      console.log(`  • ${plot.name || 'Sans nom'} (${plot.id})`);
    });
  }

  if (analysis.hasMatch.length > 0) {
    log(colors.green, '\n✓ Correspondances trouvées');
    console.log('Ces parcelles existent déjà dans farm_file_plots:\n');
    analysis.hasMatch.forEach(({ orphan, matches }) => {
      console.log(`  • ${orphan.name} → ${matches.length} match(es) trouvé(s)`);
    });
  }

  if (analysis.noMatch.length > 0) {
    log(colors.red, '\n✗ Parcelles sans correspondance (À MIGRER)');
    console.log('Ces parcelles doivent être migrées vers farm_file_plots:\n');
    analysis.noMatch.forEach(plot => {
      console.log(`  • ${plot.name || 'Sans nom'}`);
      console.log(`    Producer: ${plot.producer_id || 'NULL'}`);
      console.log(`    Date: ${plot.created_at}`);
      console.log();
    });
  }
}

/**
 * Sauvegarde le SQL dans un fichier
 */
async function saveMigrationSQL(sql) {
  if (!sql) return;

  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `supabase/migrations/${timestamp}_migrate_orphan_plots.sql`;

  fs.writeFileSync(filename, sql);
  log(colors.green, `\n✅ SQL sauvegardé dans: ${filename}`);
}

/**
 * Fonction principale
 */
async function main() {
  console.clear();
  log(colors.bright + colors.green, `
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║        ANALYSE: Lignes Orphelines - Vérification des Données             ║
  ║                                                                           ║
  ║          Objectif: Identifier les données à migrer vers                  ║
  ║                    farm_file_plots                                        ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Analyser les orphelins
    const analysis = await analyzeOrphans();

    // Afficher le résumé
    displaySummary(analysis);

    // Générer le SQL de migration
    const migrationSQL = generateMigrationSQL(analysis.toMigrate);

    if (migrationSQL) {
      console.log('\n' + '='.repeat(80));
      log(colors.bright + colors.cyan, '  SQL DE MIGRATION GÉNÉRÉ');
      console.log('='.repeat(80));
      console.log(migrationSQL);

      // Sauvegarder dans un fichier
      await saveMigrationSQL(migrationSQL);

      log(colors.bright + colors.yellow, '\n⚠️  PROCHAINES ÉTAPES');
      console.log(`
  1. Vérifier le fichier SQL généré
  2. Tester sur staging: supabase db push
  3. Valider les données migrées
  4. Appliquer en production
      `);
    }

    log(colors.bright + colors.green, '\n✅ Analyse terminée avec succès\n');

  } catch (error) {
    log(colors.red, `\n❌ Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

