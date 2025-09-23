const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCompleteTestSystem() {
  console.log('🚀 Creating complete test system...');
  
  try {
    // 1. Créer une coopérative
    console.log('\n📋 Step 1: Creating cooperative...');
    const { data: cooperative, error: coopError } = await supabase
      .from('cooperatives')
      .insert({
        name: 'Coopérative Agricole de Test',
        description: 'Coopérative de test pour démonstration',
        region: 'Kaolack',
        department: 'Kaolack',
        commune: 'Kaolack',
        address: 'Rue de la Paix, Kaolack',
        phone: '+221 33 123 45 67',
        email: 'contact@coop-test.sn',
        contact_person: 'M. Diallo',
        geom: 'POINT(-16.0758 14.1514)' // Kaolack coordinates
      })
      .select()
      .single();

    if (coopError) {
      console.error('❌ Error creating cooperative:', coopError);
      return;
    }
    console.log('✅ Cooperative created:', cooperative.name);

    // 2. Récupérer ou créer une saison
    console.log('\n📅 Step 2: Getting season...');
    let { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('label', 'Campagne 2025-2026')
      .single();

    if (seasonError && seasonError.code === 'PGRST116') {
      // Saison n'existe pas, la créer
      const { data: newSeason, error: createSeasonError } = await supabase
        .from('seasons')
        .insert({
          label: 'Campagne 2025-2026',
          start_date: '2025-06-01',
          end_date: '2026-05-31',
          is_active: true
        })
        .select()
        .single();
      
      if (createSeasonError) {
        console.error('❌ Error creating season:', createSeasonError);
        return;
      }
      season = newSeason;
      console.log('✅ Season created:', season.label);
    } else if (seasonError) {
      console.error('❌ Error getting season:', seasonError);
      return;
    } else {
      console.log('✅ Season found:', season.label);
    }

    // 3. Récupérer ou créer un producteur
    console.log('\n👨‍🌾 Step 3: Getting producer...');
    let { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('*')
      .eq('phone', '+221 77 123 45 67')
      .single();

    if (producerError && producerError.code === 'PGRST116') {
      // Producteur n'existe pas, le créer
      const { data: newProducer, error: createProducerError } = await supabase
        .from('producers')
        .insert({
          cooperative_id: cooperative.id,
          first_name: 'Amadou',
          last_name: 'Diop',
          phone: '+221 77 123 45 67',
          email: 'amadou.diop@test.sn',
          gender: 'M',
          village: 'Ndiaganiao',
          commune: 'Kaolack',
          department: 'Kaolack',
          region: 'Kaolack',
          address: 'Ndiaganiao, Kaolack',
          household_size: 8,
          farming_experience_years: 15,
          primary_language: 'fr',
          education_level: 'secondaire',
          is_active: true
        })
        .select()
        .single();
      
      if (createProducerError) {
        console.error('❌ Error creating producer:', createProducerError);
        return;
      }
      producer = newProducer;
      console.log('✅ Producer created:', `${producer.first_name} ${producer.last_name}`);
    } else if (producerError) {
      console.error('❌ Error getting producer:', producerError);
      return;
    } else {
      console.log('✅ Producer found:', `${producer.first_name} ${producer.last_name}`);
    }

    // 3.5. Utiliser un profil agent existant
    console.log('\n👨‍💼 Step 3.5: Using existing agent profile...');
    console.log('✅ Using agent profile ID: 0f33842a-a1f1-4ad5-8113-39285e5013df');

    // 4. Récupérer ou créer des parcelles
    console.log('\n🌾 Step 4: Getting plots...');
    let { data: createdPlots, error: plotsError } = await supabase
      .from('plots')
      .select('*')
      .eq('producer_id', producer.id);

    if (plotsError) {
      console.error('❌ Error getting plots:', plotsError);
      return;
    }

    if (!createdPlots || createdPlots.length === 0) {
      // Créer des parcelles si elles n'existent pas
      const plots = [
        {
          name: 'Parcelle A1 - Maïs',
          producer_id: producer.id,
          geom: 'POINT(-16.0758 14.1514)' // Point central pour la parcelle A1
        },
        {
          name: 'Parcelle B2 - Légumes',
          producer_id: producer.id,
          geom: 'POINT(-16.0740 14.1514)' // Point central pour la parcelle B2
        }
      ];

      const { data: newPlots, error: createPlotsError } = await supabase
        .from('plots')
        .insert(plots)
        .select();

      if (createPlotsError) {
        console.error('❌ Error creating plots:', createPlotsError);
        return;
      }
      createdPlots = newPlots;
      console.log('✅ Plots created:', createdPlots.length);
    } else {
      console.log('✅ Plots found:', createdPlots.length);
    }

    // 4.5. Créer un farm_file pour le producteur
    console.log('\n📁 Step 4.5: Creating farm file...');
    const { data: farmFile, error: farmFileError } = await supabase
      .from('farm_files')
      .insert({
        responsible_producer_id: producer.id,
        name: `Fiche ${producer.first_name} ${producer.last_name}`,
        status: 'draft',
        created_by: '0f33842a-a1f1-4ad5-8113-39285e5013df', // ID du profil agent existant
        region: producer.region,
        department: producer.department,
        commune: producer.commune,
        village: producer.village,
        sector: 'Secteur 1', // Ajout du secteur obligatoire
        census_date: new Date().toISOString().split('T')[0], // Date du jour
        cooperative_id: cooperative.id
      })
      .select()
      .single();

    if (farmFileError) {
      console.error('❌ Error creating farm file:', farmFileError);
      return;
    }
    console.log('✅ Farm file created:', farmFile.name);

    // 4.6. Créer des farm_file_plots (données saisonnières)
    console.log('\n🌾 Step 4.6: Creating farm file plots...');
    const farmFilePlots = [
      {
        farm_file_id: farmFile.id,
        plot_id: createdPlots[0].id,
        producer_id: producer.id,
        name_season_snapshot: 'Parcelle A1 - Maïs',
        area_hectares: 2.5,
        soil_type: 'clay',
        water_source: 'well',
        status: 'active',
        geom: 'POLYGON((-16.0758 14.1514, -16.0750 14.1514, -16.0750 14.1520, -16.0758 14.1520, -16.0758 14.1514))'
      },
      {
        farm_file_id: farmFile.id,
        plot_id: createdPlots[1].id,
        producer_id: producer.id,
        name_season_snapshot: 'Parcelle B2 - Légumes',
        area_hectares: 1.2,
        soil_type: 'sandy',
        water_source: 'well',
        status: 'active',
        geom: 'POLYGON((-16.0740 14.1514, -16.0735 14.1514, -16.0735 14.1520, -16.0740 14.1520, -16.0740 14.1514))'
      }
    ];

    const { data: createdFarmFilePlots, error: farmFilePlotsError } = await supabase
      .from('farm_file_plots')
      .insert(farmFilePlots)
      .select();

    if (farmFilePlotsError) {
      console.error('❌ Error creating farm file plots:', farmFilePlotsError);
      return;
    }
    console.log('✅ Farm file plots created:', createdFarmFilePlots.length);

    // 5. Créer des cultures
    console.log('\n🌱 Step 5: Creating crops...');
    const crops = [
      {
        plot_id: createdFarmFilePlots[0].id,
        farm_file_plot_id: createdFarmFilePlots[0].id,
        season_id: season.id,
        crop_type: 'Maize',
        variety: 'variété locale',
        sowing_date: '2025-06-15',
        expected_harvest_date: '2025-10-15',
        area_hectares: 2.5,
        status: 'en_cours'
      },
      {
        plot_id: createdFarmFilePlots[1].id,
        farm_file_plot_id: createdFarmFilePlots[1].id,
        season_id: season.id,
        crop_type: 'Other',
        variety: 'tomates',
        sowing_date: '2025-07-01',
        expected_harvest_date: '2025-09-15',
        area_hectares: 1.2,
        status: 'en_cours'
      }
    ];

    const { data: createdCrops, error: cropsError } = await supabase
      .from('crops')
      .insert(crops)
      .select();

    if (cropsError) {
      console.error('❌ Error creating crops:', cropsError);
      return;
    }
    console.log('✅ Crops created:', createdCrops.length);

    // 6. Créer des opérations
    console.log('\n🔧 Step 6: Creating operations...');
    const operations = [
      {
        crop_id: createdCrops[0].id,
        plot_id: createdFarmFilePlots[0].id,
        operation_type: 'semis',
        operation_date: '2025-06-15',
        description: 'Semis de maïs avec semoir',
        performer_id: producer.id
      },
      {
        crop_id: createdCrops[0].id,
        plot_id: createdFarmFilePlots[0].id,
        operation_type: 'fertilisation',
        operation_date: '2025-07-01',
        description: 'Application d\'engrais NPK 15-15-15',
        performer_id: producer.id
      },
      {
        crop_id: createdCrops[1].id,
        plot_id: createdFarmFilePlots[1].id,
        operation_type: 'irrigation',
        operation_date: '2025-07-15',
        description: 'Irrigation par goutte à goutte',
        performer_id: producer.id
      }
    ];

    const { data: createdOperations, error: operationsError } = await supabase
      .from('operations')
      .insert(operations)
      .select();

    if (operationsError) {
      console.error('❌ Error creating operations:', operationsError);
      return;
    }
    console.log('✅ Operations created:', createdOperations.length);

    // 7. Créer des observations
    console.log('\n👁️ Step 7: Creating observations...');
    const observations = [
      {
        crop_id: createdCrops[0].id,
        plot_id: createdFarmFilePlots[0].id,
        observation_type: 'levée',
        observation_date: '2025-06-25',
        description: 'Bonne levée du maïs, 85% des graines ont germé',
        severity: 2,
        affected_area_percent: 15,
        observed_by: 'b00a283f-0a46-41d2-af95-8a256c9c2771'
      },
      {
        crop_id: createdCrops[1].id,
        plot_id: createdFarmFilePlots[1].id,
        observation_type: 'ravageur',
        observation_date: '2025-08-01',
        description: 'Détection de chenilles sur les plants de tomates',
        severity: 3,
        affected_area_percent: 25,
        observed_by: 'b00a283f-0a46-41d2-af95-8a256c9c2771'
      }
    ];

    const { data: createdObservations, error: observationsError } = await supabase
      .from('observations')
      .insert(observations)
      .select();

    if (observationsError) {
      console.error('❌ Error creating observations:', observationsError);
      return;
    }
    console.log('✅ Observations created:', createdObservations.length);

    // 8. Créer des règles agricoles
    console.log('\n⚙️ Step 8: Creating agricultural rules...');
    const agriRules = [
      {
        code: 'FERT_URGENT',
        name: 'Fertilisation urgente',
        description: 'Alerte si pas de fertilisation 30 jours après semis',
        condition_sql: 'crops.sowing_date < CURRENT_DATE - INTERVAL \'30 days\' AND NOT EXISTS (SELECT 1 FROM operations WHERE operations.crop_id = crops.id AND operations.operation_type = \'fertilisation\')',
        action_type: 'notification',
        action_message: 'Il est temps de fertiliser votre culture !',
        applicable_crops: ['maize', 'millet', 'sorghum'],
        applicable_regions: ['Kaolack', 'Thiès', 'Fatick']
      },
      {
        code: 'PEST_MEDIUM',
        name: 'Lutte contre les ravageurs',
        description: 'Alerte si observation de ravageurs avec sévérité > 2',
        condition_sql: 'observations.observation_type = \'ravageur\' AND observations.severity > 2',
        action_type: 'recommendation',
        action_message: 'Traitement recommandé contre les ravageurs détectés.',
        applicable_crops: ['vegetables', 'maize'],
        applicable_regions: ['Kaolack', 'Thiès']
      }
    ];

    const { data: createdRules, error: rulesError } = await supabase
      .from('agri_rules')
      .insert(agriRules)
      .select();

    if (rulesError) {
      console.error('❌ Error creating agricultural rules:', rulesError);
      return;
    }
    console.log('✅ Agricultural rules created:', createdRules.length);

    console.log('\n🎉 Complete test system created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Cooperative: ${cooperative.name}`);
    console.log(`- Producer: ${producer.first_name} ${producer.last_name}`);
    console.log(`- Farm File: ${farmFile.name}`);
    console.log(`- Plots: ${createdPlots.length}`);
    console.log(`- Farm File Plots: ${createdFarmFilePlots.length}`);
    console.log(`- Crops: ${createdCrops.length}`);
    console.log(`- Operations: ${createdOperations.length}`);
    console.log(`- Observations: ${createdObservations.length}`);
    console.log(`- Rules: ${createdRules.length}`);

    return {
      cooperative,
      producer,
      farmFile,
      plots: createdPlots,
      farmFilePlots: createdFarmFilePlots,
      crops: createdCrops,
      operations: createdOperations,
      observations: createdObservations,
      rules: createdRules
    };

  } catch (error) {
    console.error('❌ Error creating test system:', error);
  }
}

createCompleteTestSystem();
