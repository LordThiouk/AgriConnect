/**
 * Vérifier la taille de la réponse du RPC get_agent_today_visits
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

async function checkRPCResponseSize() {
  console.log('📊 Vérification de la taille des réponses RPC\n');
  console.log('═'.repeat(80));
  
  // Trouver tous les agents
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, user_id, phone, display_name')
    .eq('role', 'agent');
  
  if (!agents || agents.length === 0) {
    console.log('❌ Aucun agent trouvé');
    return;
  }
  
  console.log(`\n✅ ${agents.length} agents trouvés\n`);
  
  for (const agent of agents) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Agent: ${agent.display_name || agent.phone}`);
    console.log(`user_id: ${agent.user_id}`);
    
    // Appeler le RPC
    const { data, error } = await supabase
      .rpc('get_agent_today_visits', { p_user_id: agent.user_id });
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.code} - ${error.message}`);
    } else {
      const jsonString = JSON.stringify(data);
      const sizeKB = (jsonString.length / 1024).toFixed(2);
      
      console.log(`  ✅ Réponse reçue`);
      console.log(`     Visites: ${data ? data.length : 0}`);
      console.log(`     Taille: ${sizeKB} KB`);
      console.log(`     Caractères: ${jsonString.length}`);
      
      if (data && data.length > 0) {
        console.log(`     Exemple première visite:`);
        console.log(`       - producer: ${data[0].producer}`);
        console.log(`       - location: ${data[0].location}`);
        console.log(`       - visit_date: ${data[0].visit_date}`);
      }
      
      // Alerter si trop gros
      if (jsonString.length > 100000) {
        console.log(`\n     ⚠️  RÉPONSE TRÈS GRANDE (>100KB) - Peut causer des erreurs réseau`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Analyse terminée\n');
}

checkRPCResponseSize().catch(console.error);

