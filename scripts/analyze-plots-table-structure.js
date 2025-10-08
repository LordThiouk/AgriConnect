#!/usr/bin/env node

/**
 * Script d'analyse : Structure de la table plots
 * 
 * Objectif: Analyser le type réel de la colonne geom et autres colonnes géométriques
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
 * Fonction principale
 */
async function main() {
  console.clear();
  log(colors.bright + colors.cyan, `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ANALYSE: Structure de la table plots                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  try {
    // Récupérer un échantillon de données
    const { data: plots, error } = await supabase
      .from('plots')
      .select('*')
      .limit(3);

    if (error) {
      log(colors.red, `❌ Erreur: ${error.message}`);
      process.exit(1);
    }

    if (!plots || plots.length === 0) {
      log(colors.yellow, '⚠️  Table vide');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.cyan, '  STRUCTURE DE LA TABLE');
    console.log('='.repeat(80) + '\n');

    // Analyser la première ligne
    const firstPlot = plots[0];
    const columns = Object.keys(firstPlot);

    log(colors.green, `✓ ${plots.length} parcelle(s) trouvée(s)`);
    log(colors.green, `✓ ${columns.length} colonnes détectées\n`);

    console.log('Colonnes et leurs types:');
    console.log('-'.repeat(80));

    columns.forEach(col => {
      const value = firstPlot[col];
      let type = typeof value;
      let displayValue = value;

      // Analyse spécifique par type
      if (value === null) {
        type = 'null';
        displayValue = 'NULL';
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          type = 'array';
          displayValue = `Array[${value.length}]`;
        } else {
          type = 'object/jsonb';
          // Afficher la structure de l'objet
          displayValue = JSON.stringify(value).substring(0, 100);
        }
      } else if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
          type = 'timestamp';
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          type = 'uuid';
        }
        displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      }

      // Coloration spéciale pour les colonnes géométriques
      if (col === 'geom' || col === 'center_point') {
        log(colors.bright + colors.yellow, `  📍 ${col.padEnd(30)} ${type.padEnd(20)} ${displayValue}`);
      } else {
        console.log(`  • ${col.padEnd(30)} ${type.padEnd(20)} ${displayValue}`);
      }
    });

    // Analyse détaillée des colonnes géométriques
    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.cyan, '  ANALYSE DÉTAILLÉE DES COLONNES GÉOMÉTRIQUES');
    console.log('='.repeat(80) + '\n');

    for (const plot of plots) {
      console.log(`\n📍 Parcelle: ${plot.name_season_snapshot || plot.id}`);
      console.log('-'.repeat(60));

      // Analyser geom
      if (plot.geom !== undefined) {
        console.log('\n  geom:');
        console.log(`    Type JavaScript: ${typeof plot.geom}`);
        console.log(`    Valeur: ${plot.geom === null ? 'NULL' : 'Présent'}`);
        
        if (plot.geom && typeof plot.geom === 'object') {
          console.log(`    Structure:`);
          console.log(`      ${JSON.stringify(plot.geom, null, 2).split('\n').slice(0, 10).join('\n      ')}`);
          if (plot.geom.type) {
            log(colors.green, `    ✓ Type GeoJSON: ${plot.geom.type}`);
          }
          if (plot.geom.coordinates) {
            log(colors.green, `    ✓ Coordinates: Array présent`);
          }
        }
      }

      // Analyser center_point
      if (plot.center_point !== undefined) {
        console.log('\n  center_point:');
        console.log(`    Type JavaScript: ${typeof plot.center_point}`);
        console.log(`    Valeur: ${plot.center_point === null ? 'NULL' : 'Présent'}`);
        
        if (plot.center_point && typeof plot.center_point === 'object') {
          console.log(`    Structure:`);
          console.log(`      ${JSON.stringify(plot.center_point, null, 2)}`);
          if (plot.center_point.type) {
            log(colors.green, `    ✓ Type GeoJSON: ${plot.center_point.type}`);
          }
          if (plot.center_point.coordinates) {
            const coords = plot.center_point.coordinates;
            log(colors.green, `    ✓ Coordinates: [${coords[0]}, ${coords[1]}]`);
          }
        }
      }
    }

    // Recommandations
    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.cyan, '  RECOMMANDATIONS POUR LA FONCTION RPC');
    console.log('='.repeat(80) + '\n');

    const geomIsJsonb = plots[0].geom && typeof plots[0].geom === 'object';
    const centerPointIsJsonb = plots[0].center_point && typeof plots[0].center_point === 'object';

    if (geomIsJsonb) {
      log(colors.green, '✓ geom est déjà stocké en JSONB');
      console.log('  → Retourner directement: p.geom AS geom');
    } else {
      log(colors.yellow, '⚠️  geom est en type GEOMETRY');
      console.log('  → Convertir: ST_AsGeoJSON(p.geom)::jsonb AS geom');
    }

    if (centerPointIsJsonb) {
      log(colors.green, '\n✓ center_point est déjà stocké en JSONB');
      console.log('  → Retourner directement: p.center_point AS center_point');
    } else {
      log(colors.yellow, '\n⚠️  center_point est en type GEOMETRY');
      console.log('  → Convertir: ST_AsGeoJSON(p.center_point)::jsonb AS center_point');
    }

    console.log('\n' + '='.repeat(80));
    log(colors.bright + colors.green, '\n✅ Analyse terminée\n');

  } catch (error) {
    log(colors.red, `\n❌ Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

