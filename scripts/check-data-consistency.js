const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Remplacez par l'ID de l'agent que vous voulez diagnostiquer
const AGENT_ID = 'd6daff9e-c1af-4a96-ab51-bd8925813890';

async function checkDataConsistency() {
  console.log('🕵️  Démarrage du diagnostic de cohérence des données...');

  const { data: farmFiles, error: ffError } = await supabase
    .from('farm_files')
    .select('id, name, responsible_producer_id')
    .eq('created_by', AGENT_ID);

  if (ffError) {
    console.error('Erreur lors de la récupération des fiches:', ffError.message);
    return;
  }

  if (!farmFiles || farmFiles.length === 0) {
    console.log('Aucune fiche trouvée pour cet agent.');
    return;
  }

  console.log(`\n🔎 Analyse de ${farmFiles.length} fiches pour l'agent ID: ${AGENT_ID}\n`);

  let consistentCount = 0;
  let inconsistentCount = 0;
  let orphanCount = 0;

  for (const file of farmFiles) {
    process.stdout.write(`  - Fiche "${file.name}" (ID: ${file.id})... `);

    if (!file.responsible_producer_id) {
      orphanCount++;
      console.log('❌ Orpheline (responsible_producer_id est NULL)');
      continue;
    }

    const { data: producer, error: pError } = await supabase
      .from('producers')
      .select('id, first_name, last_name')
      .eq('id', file.responsible_producer_id)
      .single();

    if (pError || !producer) {
      inconsistentCount++;
      console.log(`🔥 Incohérente (ID producteur ${file.responsible_producer_id} non trouvé dans la table producers)`);
    } else {
      consistentCount++;
      console.log(`✅ Cohérente (liée à ${producer.first_name} ${producer.last_name})`);
    }
  }

  console.log('\n--- Rapport de Diagnostic ---');
  console.log(`Total de fiches analysées: ${farmFiles.length}`);
  console.log(`  - ✅ Cohérentes: ${consistentCount}`);
  console.log(`  - 🔥 Incohérentes (lien cassé): ${inconsistentCount}`);
  console.log(`  - ❌ Orphelines (pas de lien): ${orphanCount}`);
  console.log('---------------------------\n');
  
  if (inconsistentCount > 0 || orphanCount > 0) {
    console.log('Action recommandée: Vérifiez les fiches marquées "Incohérente" ou "Orpheline".');
    console.log('Les fiches orphelines peuvent être réparées si les données existent dans material_inventory.');
    console.log('Les fiches incohérentes indiquent une suppression de producteur ou une corruption de données.');
  } else {
    console.log('Toutes les fiches semblent cohérentes. Le problème "N/A" peut provenir du RPC ou de la logique front-end.');
  }
}

checkDataConsistency();
