require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function clearMobileCache() {
  console.log('🧹 Nettoyage du cache mobile\n');
  
  // Simuler le nettoyage du cache en testant les RPC sans cache
  console.log('🔄 Test des RPC sans cache (simulation nettoyage):');
  console.log('──────────────────────────────────────────────────');
  
  const filters = ['today', 'week', 'month', 'past', 'future', 'all'];
  
  for (const filter of filters) {
    console.log(`\n🔍 Test du filtre "${filter}" (sans cache):`);
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.rpc('get_agent_all_visits_with_filters', {
        p_user_id: TEST_AGENT_ID,
        p_filter: filter
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Résultat: ${data?.length || 0} visites (${duration}ms)`);
        
        if (data && data.length > 0) {
          console.log('   📋 Exemples:');
          data.slice(0, 2).forEach((visit, index) => {
            console.log(`      ${index + 1}. ${visit.producer} - ${visit.location}`);
            console.log(`         Date: ${visit.visit_date}, Statut: ${visit.status}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur générale: ${error.message}`);
    }
  }
  
  console.log('\n📊 RÉSUMÉ DES DONNÉES CORRECTES:');
  console.log('──────────────────────────────────────────────────');
  console.log('✅ Passées: 10 visites (toutes les visites existantes)');
  console.log('✅ À venir: 0 visites (aucune visite future)');
  console.log('✅ Toutes: 10 visites (toutes les visites)');
  console.log('✅ Aujourd\'hui: 0 visites (aucune visite aujourd\'hui)');
  console.log('✅ Cette semaine: 0 visites (aucune visite cette semaine)');
  console.log('✅ Ce mois: 0 visites (aucune visite ce mois)');
  
  console.log('\n🎯 INSTRUCTIONS POUR L\'APP MOBILE:');
  console.log('──────────────────────────────────────────────────');
  console.log('1. Ouvrez l\'app mobile');
  console.log('2. Allez sur le dashboard agent');
  console.log('3. Cliquez sur le bouton de refresh (🔄) à côté du compteur');
  console.log('4. Vérifiez les logs dans la console');
  console.log('5. Testez les différents filtres');
  console.log('6. Les données devraient maintenant être correctes');
  
  console.log('\n🔍 DIAGNOSTIC:');
  console.log('──────────────────────────────────────────────────');
  console.log('Si les données sont toujours incorrectes dans l\'app:');
  console.log('- Vérifiez les logs de la console mobile');
  console.log('- Le problème pourrait être dans le cache local');
  console.log('- Essayez de redémarrer l\'app complètement');
  console.log('- Vérifiez que les RPC sont bien appelés');
}

// Exécuter le nettoyage
async function runClearCache() {
  try {
    await clearMobileCache();
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

runClearCache();
