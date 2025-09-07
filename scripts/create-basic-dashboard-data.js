#!/usr/bin/env node

/**
 * Script de création de données de base pour le dashboard AgriConnect
 * Crée seulement les données essentielles sans les utilisateurs problématiques
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
async function createBasicDashboardData() {
  console.log('🚀 Création des données de base pour le dashboard...\n');

  try {
    // 1. Créer les coopératives
    console.log('📊 Création des coopératives...');
    const { data: createdCoops, error: coopError } = await supabase
      .from('cooperatives')
      .insert(cooperatives)
      .select();

    if (coopError) throw coopError;
    console.log(`✅ ${createdCoops.length} coopératives créées`);

    // 2. Récupérer une saison existante
    console.log('📅 Récupération des saisons...');
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('id')
      .limit(1);

    if (seasonsError) throw seasonsError;
    console.log(`✅ Saison trouvée: ${seasons[0].id}`);

    // 3. Créer des producteurs de test (sans profile_id pour éviter les problèmes)
    console.log('🌾 Création des producteurs de test...');
    const testProducers = [];
    for (let coopIndex = 0; coopIndex < createdCoops.length; coopIndex++) {
      const coop = createdCoops[coopIndex];
      const producerCount = Math.floor(Math.random() * 20) + 30; // 30-50 par coopérative
      
      for (let i = 0; i < producerCount; i++) {
        testProducers.push({
          cooperative_id: coop.id,
          first_name: `Producteur${i + 1}`,
          last_name: coop.name.split(' ')[2],
          phone: generatePhone(),
          email: `producteur${i + 1}@${coop.name.toLowerCase().replace(/\s+/g, '-')}.sn`,
          birth_date: '1980-01-01',
          gender: randomChoice(['M', 'F']),
          village: `${coop.commune} Village ${i + 1}`,
          commune: coop.commune,
          department: coop.department,
          region: coop.region,
          address: `${coop.commune}, ${coop.region}`,
          household_size: Math.floor(Math.random() * 8) + 1,
          farming_experience_years: Math.floor(Math.random() * 30) + 5,
          primary_language: 'fr',
          education_level: randomChoice(['none', 'primary', 'secondary', 'higher']),
          is_active: true
        });
      }
    }

    const { data: createdProducers, error: producersError } = await supabase
      .from('producers')
      .insert(testProducers)
      .select();

    if (producersError) throw producersError;
    console.log(`✅ ${createdProducers.length} producteurs créés`);

    // 4. Créer des parcelles de test
    console.log('🏞️ Création des parcelles de test...');
    const testPlots = [];
    for (let i = 0; i < createdProducers.length; i++) {
      const producer = createdProducers[i];
      const plotCount = Math.floor(Math.random() * 3) + 1; // 1-3 parcelles par producteur
      
      for (let j = 0; j < plotCount; j++) {
        const plotId = uuidv4();
        const area = randomBetween(0.5, 5.0);
        const coop = createdCoops.find(c => c.id === producer.cooperative_id);
        
        testPlots.push({
          id: plotId,
          producer_id: producer.id, // On utilise l'ID généré par la base
          cooperative_id: producer.cooperative_id,
          name: `Parcelle ${j + 1} - ${producer.first_name}`,
          area_hectares: Math.round(area * 100) / 100,
          soil_type: randomChoice(['sandy', 'clay', 'loam', 'silt', 'organic', 'other']),
          soil_ph: Math.round(randomBetween(5.0, 8.5) * 10) / 10,
          water_source: randomChoice(['rain', 'irrigation', 'well', 'river', 'other']),
          irrigation_type: randomChoice(['none', 'drip', 'sprinkler', 'flood', 'other']),
          slope_percent: Math.floor(Math.random() * 20),
          elevation_meters: Math.floor(randomBetween(10, 200)),
          status: 'active',
          notes: `Parcelle de ${Math.round(area * 100) / 100} hectares`,
          center_point: {
            type: 'Point',
            coordinates: [
              coop.geom.coordinates[0] + (Math.random() - 0.5) * 0.1,
              coop.geom.coordinates[1] + (Math.random() - 0.5) * 0.1
            ]
          }
        });
      }
    }

    const { error: plotsError } = await supabase
      .from('plots')
      .insert(testPlots);

    if (plotsError) throw plotsError;
    console.log(`✅ ${testPlots.length} parcelles créées`);

    // 5. Créer des cultures de test
    console.log('🌱 Création des cultures de test...');
    const testCrops = [];
    for (let i = 0; i < testPlots.length; i++) {
      const plot = testPlots[i];
      const cropId = uuidv4();
      const cropType = randomChoice(cropTypes);
      const sowingDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
      const expectedHarvest = new Date(sowingDate);
      expectedHarvest.setMonth(expectedHarvest.getMonth() + 6);

      testCrops.push({
        id: cropId,
        plot_id: plot.id,
        season_id: seasons[0].id,
        crop_type: cropType,
        variety: `${cropType} variety ${i + 1}`,
        sowing_date: sowingDate.toISOString().split('T')[0],
        expected_harvest_date: expectedHarvest.toISOString().split('T')[0],
        actual_harvest_date: Math.random() > 0.7 ? expectedHarvest.toISOString().split('T')[0] : null,
        expected_yield_kg: Math.floor(Math.random() * 2000) + 1000,
        actual_yield_kg: Math.random() > 0.6 ? Math.floor(Math.random() * 2000) + 1000 : null,
        status: Math.random() > 0.8 ? 'recolte' : 'en_cours',
        notes: `Culture de ${cropType} plantée le ${sowingDate.toISOString().split('T')[0]}`
      });
    }

    const { data: createdCrops, error: cropsError } = await supabase
      .from('crops')
      .insert(testCrops)
      .select();

    if (cropsError) throw cropsError;
    console.log(`✅ ${createdCrops.length} cultures créées`);

    // 6. Créer quelques recommandations de test
    console.log('📢 Création des recommandations de test...');
    const testRecommendations = [];
    for (let i = 0; i < 10; i++) {
      const crop = createdCrops[Math.floor(Math.random() * createdCrops.length)];
      const plot = testPlots.find(p => p.id === crop.plot_id);
      const producer = createdProducers.find(p => p.id === plot.producer_id);
      
      testRecommendations.push({
        id: uuidv4(),
        crop_id: crop.id,
        plot_id: plot.id,
        producer_id: producer.id,
        rule_code: null, // Pas de référence à une règle pour éviter les erreurs de foreign key
        title: `Recommandation Test ${i + 1}`,
        message: `Action recommandée pour ${crop.crop_type} (niveau ${Math.floor(Math.random() * 5) + 1})`,
        recommendation_type: randomChoice(['fertilisation', 'irrigation', 'pest_control', 'harvest', 'other']),
        priority: randomChoice(['low', 'medium', 'high', 'urgent']),
        status: randomChoice(['pending', 'sent', 'acknowledged', 'completed', 'dismissed']),
        sent_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        acknowledged_at: Math.random() > 0.7 ? new Date().toISOString() : null,
        completed_at: Math.random() > 0.8 ? new Date().toISOString() : null
      });
    }

    const { error: recommendationsError } = await supabase
      .from('recommendations')
      .insert(testRecommendations);

    if (recommendationsError) throw recommendationsError;
    console.log(`✅ ${testRecommendations.length} recommandations créées`);

    // Résumé final
    console.log('\n🎉 Données de base créées avec succès !');
    console.log('📊 Résumé :');
    console.log(`   • Coopératives: ${createdCoops.length}`);
    console.log(`   • Producteurs: ${createdProducers.length}`);
    console.log(`   • Parcelles: ${testPlots.length}`);
    console.log(`   • Cultures: ${createdCrops.length}`);
    console.log(`   • Recommandations: ${testRecommendations.length}`);

    // Statistiques par coopérative
    console.log('\n📈 Statistiques par coopérative :');
    for (const coop of createdCoops) {
      const coopProducers = createdProducers.filter(p => p.cooperative_id === coop.id).length;
      const coopPlots = testPlots.filter(p => p.cooperative_id === coop.id).length;
      const coopCrops = createdCrops.filter(c => testPlots.find(p => p.id === c.plot_id)?.cooperative_id === coop.id).length;
      const totalArea = testPlots.filter(p => p.cooperative_id === coop.id).reduce((sum, p) => sum + p.area_hectares, 0);
      
      console.log(`   • ${coop.name}:`);
      console.log(`     - Producteurs: ${coopProducers}`);
      console.log(`     - Parcelles: ${coopPlots}`);
      console.log(`     - Cultures: ${coopCrops}`);
      console.log(`     - Superficie totale: ${Math.round(totalArea)} ha`);
    }

    console.log('\n✅ Données prêtes pour le dashboard !');
    console.log('💡 Vous pouvez maintenant développer l\'interface du dashboard avec ces données.');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    process.exit(1);
  }
}

// Exécution
createBasicDashboardData();
