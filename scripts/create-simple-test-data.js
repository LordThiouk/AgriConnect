#!/usr/bin/env node

/**
 * Script simple de création de données de test pour le dashboard AgriConnect
 * Évite les triggers problématiques en utilisant des requêtes SQL directes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Données de test
const cooperatives = [
  {
    name: 'Coopérative du Nord',
    region: 'Thiès',
    department: 'Thiès',
    commune: 'Thiès',
    geom: { type: 'Point', coordinates: [-16.9269, 14.7886] }
  },
  {
    name: 'Coopérative du Sud',
    region: 'Ziguinchor',
    department: 'Ziguinchor',
    commune: 'Ziguinchor',
    geom: { type: 'Point', coordinates: [-16.2739, 12.5831] }
  },
  {
    name: 'Coopérative du Centre',
    region: 'Kaolack',
    department: 'Kaolack',
    commune: 'Kaolack',
    geom: { type: 'Point', coordinates: [-16.0758, 14.1514] }
  }
];

const cropTypes = ['maize', 'millet', 'sorghum', 'rice', 'peanuts', 'cotton', 'vegetables', 'fruits', 'other'];

// Fonctions utilitaires
function generatePhone() {
  return `+221${Math.floor(Math.random() * 90000000) + 10000000}`;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Fonction principale
async function createSimpleTestData() {
  console.log('🚀 Création des données de test simples pour le dashboard...\n');

  try {
    // 1. Créer les coopératives
    console.log('📊 Création des coopératives...');
    const { data: createdCoops, error: coopError } = await supabase
      .from('cooperatives')
      .insert(cooperatives)
      .select();

    if (coopError) throw coopError;
    console.log(`✅ ${createdCoops.length} coopératives créées`);

    // 2. Créer quelques utilisateurs de test simples
    console.log('👥 Création des utilisateurs de test...');
    const testUsers = [
      {
        id: uuidv4(),
        user_id: uuidv4(),
        role: 'supervisor',
        display_name: 'Superviseur Test',
        region: 'Thiès',
        cooperative: 'Coopérative du Nord'
      },
      {
        id: uuidv4(),
        user_id: uuidv4(),
        role: 'agent',
        display_name: 'Agent Test',
        region: 'Thiès',
        cooperative: 'Coopérative du Nord'
      }
    ];

    // Désactiver temporairement les triggers
    await supabase.rpc('exec', { 
      sql: 'ALTER TABLE profiles DISABLE TRIGGER ALL;' 
    });

    const { error: usersError } = await supabase
      .from('profiles')
      .insert(testUsers);

    if (usersError) throw usersError;
    console.log(`✅ ${testUsers.length} utilisateurs créés`);

    // Réactiver les triggers
    await supabase.rpc('exec', { 
      sql: 'ALTER TABLE profiles ENABLE TRIGGER ALL;' 
    });

    // 3. Créer des producteurs de test
    console.log('🌾 Création des producteurs de test...');
    const testProducers = [];
    for (let i = 0; i < 10; i++) {
      const producerId = uuidv4();
      testProducers.push({
        profile_id: producerId,
        cooperative_id: createdCoops[0].id,
        first_name: `Producteur${i + 1}`,
        last_name: 'Test',
        phone: generatePhone(),
        email: `producteur${i + 1}@test.sn`,
        birth_date: '1980-01-01',
        gender: 'M',
        village: `Village ${i + 1}`,
        commune: 'Thiès',
        department: 'Thiès',
        region: 'Thiès',
        address: `Adresse ${i + 1}`,
        household_size: Math.floor(Math.random() * 8) + 1,
        farming_experience_years: Math.floor(Math.random() * 30) + 5,
        primary_language: 'fr',
        education_level: 'primary',
        is_active: true
      });
    }

    const { error: producersError } = await supabase
      .from('producers')
      .insert(testProducers);

    if (producersError) throw producersError;
    console.log(`✅ ${testProducers.length} producteurs créés`);

    // 4. Créer des parcelles de test
    console.log('🏞️ Création des parcelles de test...');
    const testPlots = [];
    for (let i = 0; i < 20; i++) {
      const plotId = uuidv4();
      const area = randomBetween(0.5, 5.0);
      testPlots.push({
        id: plotId,
        producer_id: testProducers[Math.floor(Math.random() * testProducers.length)].profile_id,
        cooperative_id: createdCoops[0].id,
        name: `Parcelle Test ${i + 1}`,
        area_hectares: Math.round(area * 100) / 100,
        soil_type: randomChoice(['sandy', 'clay', 'loam', 'silt', 'organic', 'other']),
        soil_ph: Math.round(randomBetween(5.0, 8.5) * 10) / 10,
        water_source: randomChoice(['rain', 'irrigation', 'well', 'river', 'other']),
        irrigation_type: randomChoice(['none', 'drip', 'sprinkler', 'flood', 'other']),
        slope_percent: Math.floor(Math.random() * 20),
        elevation_meters: Math.floor(randomBetween(10, 200)),
        status: 'active',
        notes: `Parcelle de test ${i + 1}`,
        center_point: {
          type: 'Point',
          coordinates: [
            createdCoops[0].geom.coordinates[0] + (Math.random() - 0.5) * 0.1,
            createdCoops[0].geom.coordinates[1] + (Math.random() - 0.5) * 0.1
          ]
        }
      });
    }

    const { error: plotsError } = await supabase
      .from('plots')
      .insert(testPlots);

    if (plotsError) throw plotsError;
    console.log(`✅ ${testPlots.length} parcelles créées`);

    // 5. Créer des cultures de test
    console.log('🌱 Création des cultures de test...');
    const testCrops = [];
    for (let i = 0; i < 15; i++) {
      const cropId = uuidv4();
      const plot = testPlots[Math.floor(Math.random() * testPlots.length)];
      const cropType = randomChoice(cropTypes);
      const sowingDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
      const expectedHarvest = new Date(sowingDate);
      expectedHarvest.setMonth(expectedHarvest.getMonth() + 6);

      testCrops.push({
        id: cropId,
        plot_id: plot.id,
        season_id: 'existing-season-id', // On utilisera une saison existante
        crop_type: cropType,
        variety: `${cropType} variety ${i + 1}`,
        sowing_date: sowingDate.toISOString().split('T')[0],
        expected_harvest_date: expectedHarvest.toISOString().split('T')[0],
        actual_harvest_date: Math.random() > 0.7 ? expectedHarvest.toISOString().split('T')[0] : null,
        expected_yield_kg: Math.floor(Math.random() * 2000) + 1000,
        actual_yield_kg: Math.random() > 0.6 ? Math.floor(Math.random() * 2000) + 1000 : null,
        status: Math.random() > 0.8 ? 'recolte' : 'en_cours',
        notes: `Culture de test ${i + 1}`
      });
    }

    // Récupérer une saison existante
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('id')
      .limit(1);

    if (seasonsError) throw seasonsError;
    
    // Mettre à jour les cultures avec l'ID de saison réel
    testCrops.forEach(crop => {
      crop.season_id = seasons[0].id;
    });

    const { error: cropsError } = await supabase
      .from('crops')
      .insert(testCrops);

    if (cropsError) throw cropsError;
    console.log(`✅ ${testCrops.length} cultures créées`);

    // Résumé final
    console.log('\n🎉 Données de test créées avec succès !');
    console.log('📊 Résumé :');
    console.log(`   • Coopératives: ${createdCoops.length}`);
    console.log(`   • Utilisateurs: ${testUsers.length}`);
    console.log(`   • Producteurs: ${testProducers.length}`);
    console.log(`   • Parcelles: ${testPlots.length}`);
    console.log(`   • Cultures: ${testCrops.length}`);

    // Statistiques par coopérative
    console.log('\n📈 Statistiques par coopérative :');
    for (const coop of createdCoops) {
      const coopProducers = testProducers.filter(p => p.cooperative_id === coop.id).length;
      const coopPlots = testPlots.filter(p => p.cooperative_id === coop.id).length;
      const coopCrops = testCrops.filter(c => testPlots.find(p => p.id === c.plot_id)?.cooperative_id === coop.id).length;
      const totalArea = testPlots.filter(p => p.cooperative_id === coop.id).reduce((sum, p) => sum + p.area_hectares, 0);
      
      console.log(`   • ${coop.name}:`);
      console.log(`     - Producteurs: ${coopProducers}`);
      console.log(`     - Parcelles: ${coopPlots}`);
      console.log(`     - Cultures: ${coopCrops}`);
      console.log(`     - Superficie totale: ${Math.round(totalArea)} ha`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    process.exit(1);
  }
}

// Exécution
createSimpleTestData();
