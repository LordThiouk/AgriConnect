const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisitsConstraints() {
  try {
    console.log('🔍 === VÉRIFICATION DES CONTRAINTES DE LA TABLE VISITS ===\n');

    // 1. Vérifier les contraintes de vérification
    console.log('1️⃣ Contraintes de vérification...');
    const { data: checkConstraints, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'visits'::regclass 
          AND contype = 'c'
        `
      });

    if (checkError) {
      console.log('❌ Erreur contraintes check:', checkError.message);
    } else {
      console.log('✅ Contraintes de vérification:', checkConstraints);
    }

    // 2. Vérifier les données existantes dans visits
    console.log('\n2️⃣ Données existantes dans visits...');
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select('id, plot_id, producer_id, visit_type, status')
      .limit(5);

    if (visitsError) {
      console.log('❌ Erreur données visits:', visitsError.message);
    } else {
      console.log('✅ Données visits:', visitsData);
    }

    // 3. Vérifier les farm_file_plots disponibles
    console.log('\n3️⃣ Farm file plots disponibles...');
    const { data: farmFilePlots, error: ffpError } = await supabase
      .from('farm_file_plots')
      .select('id, name_season_snapshot, producer_id')
      .limit(5);

    if (ffpError) {
      console.log('❌ Erreur farm_file_plots:', ffpError.message);
    } else {
      console.log('✅ Farm file plots:', farmFilePlots);
    }

    // 4. Tester une mise à jour simple
    console.log('\n4️⃣ Test de mise à jour...');
    const { data: testUpdate, error: updateError } = await supabase
      .from('visits')
      .update({ notes: 'Test update' })
      .eq('id', visitsData?.[0]?.id)
      .select();

    if (updateError) {
      console.log('❌ Erreur test update:', updateError.message);
    } else {
      console.log('✅ Test update réussi:', testUpdate);
    }

  } catch (error) {
    console.error('\n❌ === ERREUR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkVisitsConstraints();
