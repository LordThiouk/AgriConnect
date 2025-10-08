const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfilesAndFarmFiles() {
  console.log('🔍 Vérification des profiles et fiches d\'exploitation...\n');

  try {
    // 1. Vérifier les profiles (utilisateurs)
    console.log('1️⃣ Vérification des profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('role', 'producer')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError);
      return;
    }

    console.log(`✅ ${profiles?.length || 0} profiles producteurs trouvés:`);
    profiles?.forEach(p => {
      console.log(`   - ${p.full_name} (${p.role}) - ${p.id}`);
    });

    // 2. Vérifier les producteurs dans la table producers
    console.log('\n2️⃣ Vérification des producteurs...');
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('id, first_name, last_name, user_id')
      .limit(5);

    if (producersError) {
      console.error('❌ Erreur producteurs:', producersError);
    } else {
      console.log(`✅ ${producers?.length || 0} producteurs trouvés:`);
      producers?.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (user_id: ${p.user_id}) - ${p.id}`);
      });
    }

    // 3. Vérifier les fiches d'exploitation validées
    console.log('\n3️⃣ Vérification des fiches d\'exploitation validées...');
    const { data: validatedFarmFiles, error: validatedError } = await supabase
      .from('farm_files')
      .select('id, name, responsible_producer_id, status, created_at')
      .eq('status', 'validated')
      .limit(10);

    if (validatedError) {
      console.error('❌ Erreur fiches validées:', validatedError);
    } else {
      console.log(`✅ ${validatedFarmFiles?.length || 0} fiches validées trouvées:`);
      validatedFarmFiles?.forEach((ff, index) => {
        console.log(`   ${index + 1}. ${ff.name} (${ff.status}) - Producteur: ${ff.responsible_producer_id}`);
      });

      // 4. Vérifier les parcelles des fiches validées
      if (validatedFarmFiles && validatedFarmFiles.length > 0) {
        const farmFileIds = validatedFarmFiles.map(ff => ff.id);
        console.log(`\n4️⃣ Recherche des parcelles pour ${farmFileIds.length} fiches validées...`);

        const { data: plots, error: plotsError } = await supabase
          .from('farm_file_plots')
          .select('id, name_season_snapshot, area_hectares, farm_file_id')
          .in('farm_file_id', farmFileIds);

        if (plotsError) {
          console.error('❌ Erreur parcelles:', plotsError);
        } else {
          console.log(`✅ ${plots?.length || 0} parcelles trouvées:`);
          plots?.forEach(plot => {
            console.log(`   - ${plot.name_season_snapshot} (${plot.area_hectares} ha) - Fiche: ${plot.farm_file_id}`);
          });
        }
      }
    }

    // 5. Vérifier toutes les fiches (draft + validated)
    console.log('\n5️⃣ Vérification de toutes les fiches...');
    const { data: allFarmFiles, error: allFarmFilesError } = await supabase
      .from('farm_files')
      .select('status')
      .select('status', { count: 'exact' });

    if (allFarmFilesError) {
      console.error('❌ Erreur toutes les fiches:', allFarmFilesError);
    } else {
      // Compter par statut
      const draftCount = allFarmFiles?.filter(ff => ff.status === 'draft').length || 0;
      const validatedCount = allFarmFiles?.filter(ff => ff.status === 'validated').length || 0;
      console.log(`📊 Répartition des fiches:`);
      console.log(`   - Draft: ${draftCount}`);
      console.log(`   - Validated: ${validatedCount}`);
    }

    // 6. Test avec un producteur qui a des fiches validées (si disponible)
    if (validatedFarmFiles && validatedFarmFiles.length > 0) {
      const testFarmFile = validatedFarmFiles[0];
      console.log(`\n6️⃣ Test détaillé avec la fiche: ${testFarmFile.name}`);
      
      const { data: testPlots, error: testPlotsError } = await supabase
        .from('farm_file_plots')
        .select('id, name_season_snapshot, area_hectares, soil_type, status')
        .eq('farm_file_id', testFarmFile.id);

      if (testPlotsError) {
        console.error('❌ Erreur test parcelles:', testPlotsError);
      } else {
        console.log(`✅ ${testPlots?.length || 0} parcelles pour cette fiche:`);
        testPlots?.forEach(plot => {
          console.log(`   - ${plot.name_season_snapshot} (${plot.area_hectares} ha, ${plot.soil_type})`);
        });

        // Vérifier les cultures de ces parcelles
        if (testPlots && testPlots.length > 0) {
          const plotIds = testPlots.map(p => p.id);
          const { data: testCrops, error: testCropsError } = await supabase
            .from('crops')
            .select('id, crop_type, variety, status')
            .in('farm_file_plot_id', plotIds);

          if (testCropsError) {
            console.error('❌ Erreur test cultures:', testCropsError);
          } else {
            console.log(`✅ ${testCrops?.length || 0} cultures pour ces parcelles:`);
            testCrops?.forEach(crop => {
              console.log(`   - ${crop.crop_type} - ${crop.variety} (${crop.status})`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkProfilesAndFarmFiles().then(() => {
  console.log('\n🎉 Vérification terminée');
}).catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
});
