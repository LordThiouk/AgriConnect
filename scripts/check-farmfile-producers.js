const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Utiliser la SERVICE_ROLE_KEY pour bypasser RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducerLinks() {
  console.log('🔍 Démarrage du diagnostic des liens producteur-fiche...');

  // 1. Récupérer toutes les fiches
  const { data: farmFiles, error: farmFilesError } = await supabase
    .from('farm_files')
    .select('id, name, responsible_producer_id, material_inventory');

  if (farmFilesError) {
    console.error('❌ Erreur lors de la récupération des fiches:', farmFilesError.message);
    return;
  }

  if (!farmFiles || farmFiles.length === 0) {
    console.log('✅ Aucune fiche trouvée. La base de données est vide.');
    return;
  }

  console.log(`📊 Total de fiches trouvées: ${farmFiles.length}`);

  // 2. Identifier les fiches "orphelines"
  const orphanedFiles = farmFiles.filter(ff => !ff.responsible_producer_id);

  if (orphanedFiles.length === 0) {
    console.log('✅ Toutes les fiches sont correctement associées à un producteur.');
    return;
  }

  console.log(`\n🚨 ${orphanedFiles.length} fiches "orphelines" trouvées (sans producteur associé).`);

  // 3. Analyser les fiches orphelines pour voir si elles sont réparables
  let repairableCount = 0;
  let unrepairableCount = 0;

  console.log('\n--- Analyse des fiches orphelines ---');
  for (const file of orphanedFiles) {
    const producerData = file.material_inventory?.producerData;
    if (producerData && producerData.firstName && producerData.lastName) {
      console.log(`  - Fiche ID ${file.id} ("${file.name}"): ✅ Réparable (contient les données du producteur)`);
      repairableCount++;
    } else {
      console.log(`  - Fiche ID ${file.id} ("${file.name}"): ❌ Non réparable (données producteur manquantes)`);
      unrepairableCount++;
    }
  }

  // 4. Afficher le résumé final
  console.log('\n--- Résumé du Diagnostic ---');
  console.log(`Total de fiches: ${farmFiles.length}`);
  console.log(`Fiches orphelines: ${orphanedFiles.length}`);
  console.log(`  - ✅ Réparables: ${repairableCount}`);
  console.log(`  - ❌ Non réparables: ${unrepairableCount}`);
  console.log('\nDiagnostic terminé.');
}

checkProducerLinks().catch(console.error);
