const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function repairProducerLinks() {
  console.log('🛠️ Démarrage du script de réparation...');

  // 1. Récupérer les fiches orphelines
  const { data: orphanedFiles, error: fetchError } = await supabase
    .from('farm_files')
    .select('id, name, cooperative_id, material_inventory')
    .is('responsible_producer_id', null);

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des fiches orphelines:', fetchError.message);
    return;
  }

  if (!orphanedFiles || orphanedFiles.length === 0) {
    console.log('✅ Aucune fiche orpheline à réparer.');
    return;
  }

  console.log(`🔍 ${orphanedFiles.length} fiches orphelines trouvées.`);

  let repairedCount = 0;
  let skippedCount = 0;

  // 2. Parcourir chaque fiche et la réparer
  for (const file of orphanedFiles) {
    const producerData = file.material_inventory?.producerData;

    if (producerData && producerData.firstName && producerData.lastName) {
      try {
        console.log(`  - Traitement de la fiche ID ${file.id} ("${file.name}")...`);

        // Valider et formater la date de naissance
        let birthDate = producerData.birthDate || null;
        if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
          console.warn(`    ⚠️ Date de naissance invalide ("${birthDate}") pour la fiche ${file.id}. Sera mise à NULL.`);
          birthDate = null;
        }
        
        // Fournir un téléphone par défaut si manquant
        let phone = producerData.phone;
        if (!phone) {
          // Génère un numéro pseudo-aléatoire unique pour satisfaire la contrainte
          phone = `0000${Math.floor(100000 + Math.random() * 900000)}`;
          console.warn(`    ⚠️ Numéro de téléphone manquant pour la fiche ${file.id}. Utilisation d'une valeur unique générée : ${phone}.`);
        }

        const { data: newProducer, error: producerError } = await supabase
          .from('producers')
          .insert({
            first_name: producerData.firstName,
            last_name: producerData.lastName,
            birth_date: birthDate,
            gender: producerData.sex || null,
            cooperative_id: file.cooperative_id,
            phone: phone, // Ajout du téléphone
          })
          .select('id')
          .single();

        if (producerError) {
          throw new Error(`Erreur création producteur: ${producerError.message}`);
        }

        // 4. Mettre à jour la fiche avec le nouvel ID du producteur
        const { error: updateError } = await supabase
          .from('farm_files')
          .update({ responsible_producer_id: newProducer.id })
          .eq('id', file.id);

        if (updateError) {
          throw new Error(`Erreur mise à jour fiche: ${updateError.message}`);
        }

        console.log(`    ✅ Fiche réparée. Producteur ${newProducer.id} associé.`);
        repairedCount++;
      } catch (e) {
        console.error(`    ❌ Erreur lors du traitement de la fiche ${file.id}: ${e.message}`);
      }
    } else {
      skippedCount++;
    }
  }

  // 5. Afficher le résumé final
  console.log('\n--- Résumé de la Réparation ---');
  console.log(`Total de fiches orphelines traitées: ${orphanedFiles.length}`);
  console.log(`  - ✅ Fiches réparées: ${repairedCount}`);
  console.log(`  - ⏩ Fiches ignorées (non réparables): ${skippedCount}`);
  console.log('\nRéparation terminée.');
}

repairProducerLinks().catch(console.error);
