const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfilesSchema() {
  console.log('🔍 Vérification du schéma de la table profiles...\n');

  try {
    // Récupérer quelques profiles pour voir les colonnes disponibles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ Colonnes disponibles dans profiles:');
      const firstProfile = profiles[0];
      Object.keys(firstProfile).forEach(key => {
        console.log(`   - ${key}: ${typeof firstProfile[key]}`);
      });

      console.log('\n📋 Exemple de profile:');
      console.log(JSON.stringify(firstProfile, null, 2));
    } else {
      console.log('⚠️ Aucun profile trouvé');
    }

    // Vérifier les producteurs avec leurs user_id
    console.log('\n🔍 Vérification des producteurs avec user_id...');
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('id, first_name, last_name, user_id')
      .not('user_id', 'is', null)
      .limit(5);

    if (producersError) {
      console.error('❌ Erreur producteurs:', producersError);
    } else {
      console.log(`✅ ${producers?.length || 0} producteurs avec user_id:`);
      producers?.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (user_id: ${p.user_id})`);
      });
    }

    // Vérifier les fiches d'exploitation validées avec parcelles
    console.log('\n🔍 Vérification des fiches validées avec parcelles...');
    const { data: farmFiles, error: farmFilesError } = await supabase
      .from('farm_files')
      .select('id, name, responsible_producer_id, status')
      .eq('status', 'validated')
      .limit(5);

    if (farmFilesError) {
      console.error('❌ Erreur fiches validées:', farmFilesError);
    } else {
      console.log(`✅ ${farmFiles?.length || 0} fiches validées:`);
      farmFiles?.forEach(ff => {
        console.log(`   - ${ff.name} (${ff.status}) - Producteur: ${ff.responsible_producer_id}`);
      });

      // Vérifier les parcelles de ces fiches
      if (farmFiles && farmFiles.length > 0) {
        const farmFileIds = farmFiles.map(ff => ff.id);
        const { data: plots, error: plotsError } = await supabase
          .from('farm_file_plots')
          .select('id, name_season_snapshot, area_hectares, farm_file_id')
          .in('farm_file_id', farmFileIds);

        if (plotsError) {
          console.error('❌ Erreur parcelles:', plotsError);
        } else {
          console.log(`✅ ${plots?.length || 0} parcelles trouvées:`);
          plots?.forEach(plot => {
            console.log(`   - ${plot.name_season_snapshot} (${plot.area_hectares} ha)`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkProfilesSchema().then(() => {
  console.log('\n🎉 Vérification terminée');
}).catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
});
