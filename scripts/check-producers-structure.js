/**
 * Vérifier la structure de la table producers
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducersStructure() {
  console.log('🔍 Vérification de la structure de la table producers\n');
  console.log('═'.repeat(80));
  
  // Récupérer un producteur pour voir sa structure
  const { data: producers } = await supabase
    .from('producers')
    .select('*')
    .limit(1);
  
  if (!producers || producers.length === 0) {
    console.log('❌ Aucun producteur trouvé');
    return;
  }
  
  const producer = producers[0];
  console.log(`\n📋 Structure du producteur ${producer.id}:`);
  console.log('═'.repeat(50));
  
  Object.keys(producer).forEach(key => {
    const value = producer[key];
    const type = typeof value;
    console.log(`   ${key}: ${type} = ${value}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Vérification terminée\n');
}

checkProducersStructure().catch(console.error);
