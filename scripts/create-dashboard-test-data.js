#!/usr/bin/env node

/**
 * Script de création de données de test pour le dashboard AgriConnect
 * Crée des coopératives, utilisateurs, producteurs, parcelles, cultures et données temporelles
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
const seasons = [
  { label: 'Saison 2022', start_date: '2022-01-01', end_date: '2022-12-31' },
  { label: 'Saison 2023', start_date: '2023-01-01', end_date: '2023-12-31' },
  { label: 'Saison 2024', start_date: '2024-01-01', end_date: '2024-12-31' }
];

const operationTypes = ['semis', 'fertilisation', 'irrigation', 'desherbage', 'phytosanitaire', 'recolte', 'labour', 'reconnaissance'];

// Fonctions utilitaires
function generatePhone() {
  return `+221${Math.floor(Math.random() * 90000000) + 10000000}`;
}

function generateEmail(name, domain) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}@${domain}`;
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
async function createTestData() {
  console.log('🚀 Création des données de test pour le dashboard...\n');

  try {
    // 1. Créer les coopératives
    console.log('📊 Création des coopératives...');
    const { data: createdCoops, error: coopError } = await supabase
      .from('cooperatives')
      .insert(cooperatives)
      .select();

    if (coopError) throw coopError;
    console.log(`✅ ${createdCoops.length} coopératives créées`);

    // 2. Vérifier et créer les saisons si nécessaire
    console.log('📅 Vérification des saisons...');
    const { data: existingSeasons, error: existingSeasonsError } = await supabase
      .from('seasons')
      .select('*');

    if (existingSeasonsError) throw existingSeasonsError;

    let createdSeasons = existingSeasons;
    if (existingSeasons.length === 0) {
      console.log('📅 Création des saisons...');
      const { data: newSeasons, error: seasonError } = await supabase
        .from('seasons')
        .insert(seasons)
        .select();

      if (seasonError) throw seasonError;
      createdSeasons = newSeasons;
      console.log(`✅ ${createdSeasons.length} saisons créées`);
    } else {
      console.log(`✅ ${existingSeasons.length} saisons existantes trouvées`);
    }

    // 3. Créer les utilisateurs et producteurs
    const allUsers = [];
    const allProducers = [];
    const allPlots = [];
    const allCrops = [];
    const allOperations = [];
    const allObservations = [];
    const allRecommendations = [];

    for (let coopIndex = 0; coopIndex < createdCoops.length; coopIndex++) {
      const coop = createdCoops[coopIndex];
      console.log(`\n🏢 Traitement de ${coop.name}...`);

      // Créer superviseurs (2 par coopérative)
      for (let i = 0; i < 2; i++) {
        const supervisorId = uuidv4();
        const supervisor = {
          id: supervisorId,
          user_id: supervisorId,
          role: 'supervisor',
          display_name: `Superviseur ${i + 1} ${coop.name.split(' ')[2]}`,
          region: coop.region,
          cooperative: coop.name
        };
        allUsers.push(supervisor);
      }

      // Créer agents (4 par coopérative)
      for (let i = 0; i < 4; i++) {
        const agentId = uuidv4();
        const agent = {
          id: agentId,
          user_id: agentId,
          role: 'agent',
          display_name: `Agent ${i + 1} ${coop.name.split(' ')[2]}`,
          region: coop.region,
          cooperative: coop.name
        };
        allUsers.push(agent);
      }

      // Créer producteurs (80-100 par coopérative)
      const producerCount = Math.floor(Math.random() * 21) + 80;
      for (let i = 0; i < producerCount; i++) {
        const producerId = uuidv4();
        const producer = {
          id: producerId,
          user_id: producerId,
          role: 'producer',
          display_name: `Producteur ${i + 1} ${coop.name.split(' ')[2]}`,
          region: coop.region,
          cooperative: coop.name
        };
        allUsers.push(producer);

        // Créer profil producteur
        const producerProfile = {
          profile_id: producerId,
          cooperative_id: coop.id,
          first_name: `Producteur${i + 1}`,
          last_name: coop.name.split(' ')[2],
          phone: generatePhone(),
          email: generateEmail(`producteur${i + 1}`, 'coop-nord.sn'),
          birth_date: randomDate(new Date(1960, 0, 1), new Date(1990, 0, 1)).toISOString().split('T')[0],
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
        };
        allProducers.push(producerProfile);

        // Créer parcelles (2-4 par producteur)
        const plotCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < plotCount; j++) {
          const plotId = uuidv4();
          const area = randomBetween(0.5, 5.0);
          const plot = {
            id: plotId,
            producer_id: producerId,
            cooperative_id: coop.id,
            name: `Parcelle ${j + 1} - Producteur ${i + 1}`,
            area_hectares: Math.round(area * 100) / 100,
            soil_type: randomChoice(['sandy', 'clay', 'loam', 'silt', 'organic', 'other']),
            soil_ph: Math.round(randomBetween(5.0, 8.5) * 10) / 10,
            water_source: randomChoice(['rain', 'irrigation', 'well', 'river', 'other']),
            irrigation_type: randomChoice(['none', 'drip', 'sprinkler', 'flood', 'other']),
            slope_percent: Math.floor(Math.random() * 20),
            elevation_meters: Math.floor(randomBetween(10, 200)),
            status: randomChoice(['active', 'inactive', 'abandoned']),
            notes: `Parcelle de ${Math.round(area * 100) / 100} hectares`,
            center_point: {
              type: 'Point',
              coordinates: [
                coop.geom.coordinates[0] + (Math.random() - 0.5) * 0.1,
                coop.geom.coordinates[1] + (Math.random() - 0.5) * 0.1
              ]
            }
          };
          allPlots.push(plot);

          // Créer cultures pour chaque saison
          for (const season of createdSeasons) {
            if (Math.random() > 0.3) { // 70% de chance d'avoir une culture
              const cropId = uuidv4();
              const cropType = randomChoice(cropTypes);
              const sowingDate = randomDate(new Date(season.start_date), new Date(season.end_date));
              const expectedHarvest = new Date(sowingDate);
              expectedHarvest.setMonth(expectedHarvest.getMonth() + 6);

              const crop = {
                id: cropId,
                plot_id: plotId,
                season_id: season.id,
                crop_type: cropType,
                variety: `${cropType} variety ${Math.floor(Math.random() * 5) + 1}`,
                sowing_date: sowingDate.toISOString().split('T')[0],
                expected_harvest_date: expectedHarvest.toISOString().split('T')[0],
                actual_harvest_date: Math.random() > 0.7 ? expectedHarvest.toISOString().split('T')[0] : null,
                expected_yield_kg: Math.floor(Math.random() * 2000) + 1000,
                actual_yield_kg: Math.random() > 0.6 ? Math.floor(Math.random() * 2000) + 1000 : null,
                status: Math.random() > 0.8 ? 'recolte' : 'en_cours',
                notes: `Culture de ${cropType} plantée le ${sowingDate.toISOString().split('T')[0]}`
              };
              allCrops.push(crop);

              // Créer opérations (3-8 par culture)
              const operationCount = Math.floor(Math.random() * 6) + 3;
              for (let k = 0; k < operationCount; k++) {
                const operation = {
                  id: uuidv4(),
                  crop_id: cropId,
                  plot_id: plotId,
                  operation_type: randomChoice(operationTypes),
                  operation_date: randomDate(sowingDate, new Date(season.end_date)).toISOString().split('T')[0],
                  description: `Opération ${k + 1} pour ${cropType}`,
                  product_used: `${randomChoice(operationTypes)} product ${k + 1}`,
                  dose_per_hectare: Math.round(randomBetween(10, 100) * 100) / 100,
                  total_dose: Math.round(randomBetween(10, 100) * 100) / 100,
                  unit: randomChoice(['kg', 'l', 'pieces', 'other']),
                  cost_per_hectare: Math.round(randomBetween(50, 500) * 100) / 100,
                  total_cost: Math.round(randomBetween(50, 500) * 100) / 100,
                  performed_by: allUsers.find(u => u.role === 'agent' && u.cooperative === coop.name)?.id || null,
                  notes: `Opération ${k + 1} pour ${cropType}`
                };
                allOperations.push(operation);
              }

              // Créer observations (2-5 par culture)
              const observationCount = Math.floor(Math.random() * 4) + 2;
              for (let l = 0; l < observationCount; l++) {
                const observation = {
                  id: uuidv4(),
                  crop_id: cropId,
                  plot_id: plotId,
                  observation_date: randomDate(sowingDate, new Date(season.end_date)).toISOString().split('T')[0],
                  observation_type: randomChoice(['levée', 'maladie', 'ravageur', 'stress_hydrique', 'stress_nutritionnel', 'développement', 'other']),
                  emergence_percent: Math.floor(Math.random() * 100),
                  pest_disease_name: Math.random() > 0.7 ? randomChoice(['pest', 'disease', 'drought', 'flood']) : null,
                  severity: Math.floor(Math.random() * 5) + 1,
                  affected_area_percent: Math.round(randomBetween(0, 100) * 100) / 100,
                  description: `Observation ${l + 1} pour ${cropType}`,
                  recommendations: Math.random() > 0.5 ? `Recommandation pour ${cropType}` : null,
                  observed_by: allUsers.find(u => u.role === 'agent' && u.cooperative === coop.name)?.id || null
                };
                allObservations.push(observation);

                // Créer recommandations si problème détecté
                if (observation.pest_disease_name && observation.severity >= 3) {
                  const recommendation = {
                    id: uuidv4(),
                    crop_id: cropId,
                    plot_id: plotId,
                    producer_id: producerId,
                    rule_code: `rule_${observation.pest_disease_name}_${observation.severity}`,
                    title: `Action recommandée pour ${observation.pest_disease_name}`,
                    message: `Action recommandée pour ${observation.pest_disease_name} (niveau ${observation.severity})`,
                    recommendation_type: randomChoice(['fertilisation', 'irrigation', 'pest_control', 'harvest', 'other']),
                    priority: observation.severity >= 4 ? 'urgent' : observation.severity >= 3 ? 'high' : 'medium',
                    status: randomChoice(['pending', 'sent', 'acknowledged', 'completed', 'dismissed']),
                    sent_at: Math.random() > 0.5 ? new Date().toISOString() : null,
                    acknowledged_at: Math.random() > 0.7 ? new Date().toISOString() : null,
                    completed_at: Math.random() > 0.8 ? new Date().toISOString() : null
                  };
                  allRecommendations.push(recommendation);
                }
              }
            }
          }
        }
      }

      console.log(`✅ ${producerCount} producteurs créés pour ${coop.name}`);
    }

    // 4. Insérer tous les utilisateurs
    console.log('\n👥 Création des utilisateurs...');
    const { error: usersError } = await supabase
      .from('profiles')
      .insert(allUsers);

    if (usersError) throw usersError;
    console.log(`✅ ${allUsers.length} utilisateurs créés`);

    // 5. Insérer les producteurs
    console.log('🌾 Création des profils producteurs...');
    const { error: producersError } = await supabase
      .from('producers')
      .insert(allProducers);

    if (producersError) throw producersError;
    console.log(`✅ ${allProducers.length} profils producteurs créés`);

    // 6. Insérer les parcelles
    console.log('🏞️ Création des parcelles...');
    const { error: plotsError } = await supabase
      .from('plots')
      .insert(allPlots);

    if (plotsError) throw plotsError;
    console.log(`✅ ${allPlots.length} parcelles créées`);

    // 7. Insérer les cultures
    console.log('🌱 Création des cultures...');
    const { error: cropsError } = await supabase
      .from('crops')
      .insert(allCrops);

    if (cropsError) throw cropsError;
    console.log(`✅ ${allCrops.length} cultures créées`);

    // 8. Insérer les opérations
    console.log('🔧 Création des opérations...');
    const { error: operationsError } = await supabase
      .from('operations')
      .insert(allOperations);

    if (operationsError) throw operationsError;
    console.log(`✅ ${allOperations.length} opérations créées`);

    // 9. Insérer les observations
    console.log('👁️ Création des observations...');
    const { error: observationsError } = await supabase
      .from('observations')
      .insert(allObservations);

    if (observationsError) throw observationsError;
    console.log(`✅ ${allObservations.length} observations créées`);

    // 10. Insérer les recommandations
    console.log('📢 Création des recommandations...');
    const { error: recommendationsError } = await supabase
      .from('recommendations')
      .insert(allRecommendations);

    if (recommendationsError) throw recommendationsError;
    console.log(`✅ ${allRecommendations.length} recommandations créées`);

    // 11. Créer les membreships
    console.log('🔗 Création des adhésions...');
    const memberships = [];
    for (const user of allUsers) {
      // Trouver la coopérative correspondante basée sur le nom dans cooperative
      const coop = createdCoops.find(c => c.name === user.cooperative);
      if (coop) {
        memberships.push({
          cooperative_id: coop.id,
          profile_id: user.id,
          role_in_coop: user.role === 'producer' ? 'member' : user.role,
          joined_at: new Date().toISOString(),
          left_at: null
        });
      }
    }

    const { error: membershipsError } = await supabase
      .from('memberships')
      .insert(memberships);

    if (membershipsError) throw membershipsError;
    console.log(`✅ ${memberships.length} adhésions créées`);

    // Résumé final
    console.log('\n🎉 Données de test créées avec succès !');
    console.log('📊 Résumé :');
    console.log(`   • Coopératives: ${createdCoops.length}`);
    console.log(`   • Utilisateurs: ${allUsers.length}`);
    console.log(`   • Producteurs: ${allProducers.length}`);
    console.log(`   • Parcelles: ${allPlots.length}`);
    console.log(`   • Cultures: ${allCrops.length}`);
    console.log(`   • Opérations: ${allOperations.length}`);
    console.log(`   • Observations: ${allObservations.length}`);
    console.log(`   • Recommandations: ${allRecommendations.length}`);
    console.log(`   • Adhésions: ${memberships.length}`);

    // Statistiques par coopérative
    console.log('\n📈 Statistiques par coopérative :');
    for (const coop of createdCoops) {
      const coopProducers = allProducers.filter(p => p.cooperative_id === coop.id).length;
      const coopPlots = allPlots.filter(p => p.cooperative_id === coop.id).length;
      const coopCrops = allCrops.filter(c => allPlots.find(p => p.id === c.plot_id)?.cooperative_id === coop.id).length;
      const totalArea = allPlots.filter(p => p.cooperative_id === coop.id).reduce((sum, p) => sum + p.area_ha, 0);
      
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
createTestData();
