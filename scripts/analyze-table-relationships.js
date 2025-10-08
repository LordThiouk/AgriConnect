#!/usr/bin/env node

/**
 * Script d'analyse : Relations des tables operations, observations, recommendations, visits
 * 
 * Objectif: Vérifier quelles colonnes de référence existent déjà
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
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Analyse les colonnes d'une table
 */
async function analyzeTableColumns(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    return { error: error.message, columns: [] };
  }

  if (!data || data.length === 0) {
    return { error: 'Table vide', columns: [] };
  }

  const columns = Object.keys(data[0]);
  return { columns, sampleData: data[0] };
}

/**
 * Compte les lignes non-null pour une colonne
 */
async function countNonNull(tableName, columnName) {
  try {
    const { count } = await supabase
      .from(tableName)
      .select(columnName, { count: 'exact', head: true })
      .not(columnName, 'is', null);
    return count || 0;
  } catch (error) {
    return null; // Colonne n'existe pas
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.clear();
  log(colors.bright + colors.cyan, `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ANALYSE DES RELATIONS: operations, observations,          ║
║              recommendations, visits                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const tables = ['operations', 'observations', 'recommendations', 'visits'];
  const refColumns = ['plot_id', 'crop_id', 'producer_id'];

  console.log('\n' + '='.repeat(80));
  log(colors.bright + colors.cyan, '  ANALYSE DES COLONNES DE RÉFÉRENCE');
  console.log('='.repeat(80) + '\n');

  for (const table of tables) {
    console.log('\n' + '-'.repeat(60));
    log(colors.bright + colors.blue, `📋 TABLE: ${table.toUpperCase()}`);
    console.log('-'.repeat(60));

    const analysis = await analyzeTableColumns(table);

    if (analysis.error) {
      log(colors.red, `   ✗ Erreur: ${analysis.error}`);
      continue;
    }

    // Vérifier chaque colonne de référence
    for (const refCol of refColumns) {
      const hasColumn = analysis.columns.includes(refCol);
      
      if (hasColumn) {
        const count = await countNonNull(table, refCol);
        if (count !== null && count > 0) {
          log(colors.green, `   ✓ ${refCol.padEnd(15)} → ${count} lignes non-null`);
        } else {
          log(colors.yellow, `   ○ ${refCol.padEnd(15)} → 0 lignes (colonne existe mais vide)`);
        }
      } else {
        log(colors.red, `   ✗ ${refCol.padEnd(15)} → Colonne manquante`);
      }
    }

    // Afficher toutes les colonnes pour référence
    console.log('\n   Toutes les colonnes:');
    analysis.columns.forEach((col, i) => {
      if ((i + 1) % 4 === 0) {
        console.log(`   • ${col}`);
      } else {
        process.stdout.write(`   • ${col.padEnd(25)}`);
        if ((i + 1) % 4 === 0 || i === analysis.columns.length - 1) {
          console.log('');
        }
      }
    });
  }

  // Recommandations
  console.log('\n' + '='.repeat(80));
  log(colors.bright + colors.cyan, '  RECOMMANDATIONS');
  console.log('='.repeat(80) + '\n');

  log(colors.bright + colors.green, 'ARCHITECTURE RECOMMANDÉE:');
  console.log(`
  plots (parcelles physiques)
    ↓ (1:N)
  crops (cultures sur les parcelles)
    ↓ (1:N)
  ├── operations (opérations agricoles sur cultures)
  ├── observations (observations des cultures)
  └── recommendations (recommandations pour cultures)

  visits → plots (visite d'une parcelle)
  `);

  log(colors.bright + colors.yellow, '\nMODÈLE FLEXIBLE (RECOMMANDÉ):');
  console.log(`
  operations:
    • crop_id (optionnel) → Pour opérations sur culture
    • plot_id (optionnel) → Pour opérations sur parcelle sans culture
    → Au moins un des deux doit être renseigné

  observations:
    • crop_id (optionnel) → Observation d'une culture
    • plot_id (optionnel) → Observation d'une parcelle
    → Au moins un des deux doit être renseigné

  recommendations:
    • crop_id (optionnel) → Recommandation pour une culture
    • plot_id (optionnel) → Recommandation pour une parcelle
    • producer_id → Recommandation générale pour un producteur
    → Au moins un doit être renseigné

  visits:
    • plot_id (obligatoire) → On visite toujours une parcelle
    • producer_id → Le producteur visité
  `);

  console.log('\n' + '='.repeat(80));
  log(colors.bright + colors.green, '\n✅ Analyse terminée\n');
}

main();

