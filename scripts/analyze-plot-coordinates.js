#!/usr/bin/env node

/**
 * Script d'analyse des coordonnées des parcelles
 * Vérifie la validité et le format de center_point et geom
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2ducWJ5bWJsbnlqY29jcXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODkzMDUsImV4cCI6MjA0NDA2NTMwNX0.1uYtxBHD2t7q2VbUyYpZ8j35ioUtMOgVcWx2vKRLOUw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCoordinates() {
  console.log('🔍 Analyse des coordonnées des parcelles\n');
  console.log('═'.repeat(80));

  // 1. Récupérer quelques parcelles avec leurs coordonnées
  const { data: plots, error } = await supabase
    .from('plots')
    .select('id, name_season_snapshot, center_point, geom')
    .limit(5);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`\n📊 ${plots.length} parcelles analysées\n`);

  // 2. Analyser chaque parcelle
  for (const plot of plots) {
    console.log('─'.repeat(80));
    console.log(`📍 Parcelle: ${plot.name_season_snapshot || plot.id}`);
    console.log('─'.repeat(80));

    // Analyser center_point
    if (plot.center_point) {
      console.log('\n🎯 center_point (brut):', JSON.stringify(plot.center_point, null, 2));
      
      // Si c'est un objet GeoJSON
      if (plot.center_point.type === 'Point' && plot.center_point.coordinates) {
        const [x, y] = plot.center_point.coordinates;
        console.log(`   📍 Format: GeoJSON Point`);
        console.log(`   📍 Coordonnées: [${x}, ${y}]`);
        console.log(`   📍 X (longitude): ${x}`);
        console.log(`   📍 Y (latitude): ${y}`);
        
        // Vérifier la validité
        if (Math.abs(y) <= 90 && Math.abs(x) <= 180) {
          console.log('   ✅ Coordonnées valides');
        } else {
          console.log('   ❌ Coordonnées INVALIDES (hors limites WGS84)');
        }
        
        // Vérifier si c'est au Sénégal (approx)
        const isSenegal = (
          y >= 12 && y <= 17 &&  // Latitude Sénégal: 12°N à 17°N
          x >= -18 && x <= -11   // Longitude Sénégal: 18°W à 11°W
        );
        
        if (isSenegal) {
          console.log('   🇸🇳 Localisation: Sénégal ✓');
        } else {
          console.log(`   ⚠️  Localisation: Hors Sénégal (${y}°N, ${x}°E)`);
        }
      }
    } else {
      console.log('\n❌ center_point: NULL');
    }

    // Analyser geom
    if (plot.geom) {
      console.log('\n🗺️  geom (brut):', typeof plot.geom, plot.geom.type);
      
      if (plot.geom.type === 'Polygon' && plot.geom.coordinates) {
        const coords = plot.geom.coordinates[0]; // Premier ring
        console.log(`   📍 Type: GeoJSON Polygon`);
        console.log(`   📍 Nombre de points: ${coords.length}`);
        console.log(`   📍 Premier point: [${coords[0][0]}, ${coords[0][1]}]`);
        console.log(`   📍 Dernier point: [${coords[coords.length-1][0]}, ${coords[coords.length-1][1]}]`);
      }
    } else {
      console.log('\n❌ geom: NULL');
    }

    console.log('');
  }

  console.log('═'.repeat(80));

  // 3. Tester la fonction RPC directement
  console.log('\n\n🧪 Test de la fonction RPC get_plots_with_geolocation\n');
  console.log('═'.repeat(80));

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_plots_with_geolocation', {
      limit_param: 3
    });

  if (rpcError) {
    console.error('❌ Erreur RPC:', rpcError);
    return;
  }

  console.log(`\n✅ ${rpcData.length} parcelles retournées\n`);

  for (const plot of rpcData) {
    console.log('─'.repeat(80));
    console.log(`📍 ${plot.name || plot.id}`);
    console.log(`   🌍 Latitude: ${plot.latitude}`);
    console.log(`   🌍 Longitude: ${plot.longitude}`);
    
    // Vérifier si lat/lon sont valides
    if (plot.latitude === 0 && plot.longitude === 0) {
      console.log('   ⚠️  Coordonnées à (0,0) - Probablement NULL dans la base');
    } else if (Math.abs(plot.latitude) <= 90 && Math.abs(plot.longitude) <= 180) {
      // Vérifier Sénégal
      const isSenegal = (
        plot.latitude >= 12 && plot.latitude <= 17 &&
        plot.longitude >= -18 && plot.longitude <= -11
      );
      
      if (isSenegal) {
        console.log('   ✅ Sénégal');
      } else {
        console.log(`   ⚠️  Hors Sénégal: ${plot.latitude}°N, ${plot.longitude}°E`);
      }
    } else {
      console.log('   ❌ Coordonnées INVALIDES');
    }

    // Afficher center_point et geom
    if (plot.center_point) {
      console.log(`   📍 center_point: ${JSON.stringify(plot.center_point)}`);
    }
    if (plot.geom) {
      console.log(`   🗺️  geom type: ${plot.geom.type}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');

  // 4. Résumé et recommandations
  console.log('\n📋 RÉSUMÉ ET RECOMMANDATIONS\n');
  console.log('─'.repeat(80));
  console.log('1. Vérifier que center_point est bien un Point GEOMETRY');
  console.log('2. Vérifier que les coordonnées sont [longitude, latitude] (ordre GeoJSON)');
  console.log('3. Si latitude/longitude sont inversées dans l\'affichage, corriger la RPC');
  console.log('4. Si tout est à (0,0), les center_point sont NULL → besoin de les calculer');
  console.log('─'.repeat(80));
}

analyzeCoordinates().catch(console.error);

