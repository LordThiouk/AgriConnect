const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORPHAN_IDS_TO_DELETE = [
  '1b9b3abe-cff9-4d90-a6cb-5de1e840bc0e',
  '830dd2b2-1c90-4716-b0ac-e42f0f61ee7f',
  '3c261c26-c415-4147-85fa-d39d2b1e05e4',
  'fcbefc6b-f2f4-4359-a283-307262eef9ac',
  'e4edf2c1-3fa1-46d9-a4a4-39db29ff3889',
  'b78d0528-3a24-4f06-8832-0aadc1b135b2',
];

async function deleteOrphanFarmFiles() {
  console.log('🗑️  Début de la suppression des fiches orphelines...');

  if (ORPHAN_IDS_TO_DELETE.length === 0) {
    console.log('Aucun ID de fiche à supprimer. Le script est terminé.');
    return;
  }

  const { data, error } = await supabase
    .from('farm_files')
    .delete()
    .in('id', ORPHAN_IDS_TO_DELETE);

  if (error) {
    console.error('Erreur lors de la suppression des fiches:', error.message);
  } else {
    console.log(`✅ Suppression réussie.`);
    console.log(`Nombre de fiches supprimées: ${ORPHAN_IDS_TO_DELETE.length}`);
  }
}

deleteOrphanFarmFiles();
