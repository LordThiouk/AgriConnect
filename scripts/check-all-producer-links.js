const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProducerLinks() {
  console.log('\n🔍 Vérification de la liaison des producteurs pour toutes les fiches...');

  const { data: farmFiles, error } = await supabase
    .from('farm_files')
    .select('id, name, created_by, responsible_producer_id');

  if (error) {
    console.error('❌ Erreur lors de la récupération des fiches:', error);
    return;
  }

  if (!farmFiles || farmFiles.length === 0) {
    console.warn('⚠️ Aucune fiche trouvée dans la base de données.');
    return;
  }

  const report = farmFiles.reduce((acc, file) => {
    const agentId = file.created_by;
    if (!agentId) {
      if (!acc['sans_agent']) {
        acc['sans_agent'] = { linked: 0, orphaned: 0, total: 0 };
      }
      acc['sans_agent'].orphaned++;
      acc['sans_agent'].total++;
      return acc;
    }

    if (!acc[agentId]) {
      acc[agentId] = { linked: 0, orphaned: 0, total: 0 };
    }

    if (file.responsible_producer_id) {
      acc[agentId].linked++;
    } else {
      acc[agentId].orphaned++;
    }
    acc[agentId].total++;
    return acc;
  }, {});

  console.log('\n📊 Rapport de cohérence des données (Fiches vs Producteurs):');
  console.log('----------------------------------------------------------');
  
  Object.keys(report).forEach(agentId => {
    const stats = report[agentId];
    console.log(`\nAgent ID: ${agentId}`);
    console.log(`  - Fiches totales  : ${stats.total}`);
    console.log(`  - ✅ Liées         : ${stats.linked}`);
    console.log(`  - ❌ Orphelines    : ${stats.orphaned}`);
  });

  console.log('----------------------------------------------------------');
  console.log('\nInterprétation :');
  console.log(' - "Liées" signifie que `responsible_producer_id` est présent.');
  console.log(' - "Orphelines" signifie que `responsible_producer_id` est NULL.');
  console.log('Si un agent voit "Non Assigné", c\'est probablement parce que ses fiches sont "Orphelines".\n');
}

checkAllProducerLinks();
