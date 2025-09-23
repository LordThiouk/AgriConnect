const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listExistingRPCFunctions() {
  console.log('📋 Liste des fonctions RPC existantes pour les Alertes & Recommandations\n');

  // Fonctions à tester
  const functionsToTest = [
    // Recommendations
    { name: 'get_recommendations_with_details', params: { filters: '{}', page: 1, page_size: 1 }, category: 'Recommendations - READ' },
    { name: 'create_recommendation', params: { p_title: 'test', p_description: 'test', p_recommendation_type: 'other' }, category: 'Recommendations - CREATE' },
    { name: 'update_recommendation', params: { p_id: '00000000-0000-0000-0000-000000000000', p_title: 'test' }, category: 'Recommendations - UPDATE' },
    { name: 'delete_recommendation', params: { p_id: '00000000-0000-0000-0000-000000000000' }, category: 'Recommendations - DELETE' },
    { name: 'update_recommendation_status', params: { recommendation_id: '00000000-0000-0000-0000-000000000000', new_status: 'pending' }, category: 'Recommendations - STATUS' },
    
    // Agri Rules
    { name: 'get_agri_rules_with_filters', params: { filters: '{}', page: 1, page_size: 1 }, category: 'Agri Rules - READ' },
    { name: 'create_agri_rule', params: { p_name: 'test', p_code: 'TEST_RULE', p_description: 'test' }, category: 'Agri Rules - CREATE' },
    { name: 'update_agri_rule', params: { p_id: '00000000-0000-0000-0000-000000000000', p_name: 'test' }, category: 'Agri Rules - UPDATE' },
    { name: 'delete_agri_rule', params: { p_id: '00000000-0000-0000-0000-000000000000' }, category: 'Agri Rules - DELETE' },
    
    // Notifications
    { name: 'get_notifications_with_details', params: { filters: '{}', page: 1, page_size: 1 }, category: 'Notifications - READ' },
    { name: 'create_notification', params: { p_title: 'test', p_message: 'test' }, category: 'Notifications - CREATE' },
    { name: 'resend_notification', params: { p_id: '00000000-0000-0000-0000-000000000000' }, category: 'Notifications - RESEND' },
    
    // Stats
    { name: 'get_recommendation_stats', params: {}, category: 'Statistics - Recommendations' },
    { name: 'get_notification_stats', params: {}, category: 'Statistics - Notifications' }
  ];

  const results = {
    existing: [],
    missing: [],
    errors: []
  };

  console.log('🔍 Test de chaque fonction...\n');

  for (const func of functionsToTest) {
    try {
      console.log(`Testing ${func.name}...`);
      
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          results.missing.push(func);
          console.log(`   ❌ FONCTION MANQUANTE`);
        } else {
          results.errors.push({ ...func, error: error.message });
          console.log(`   ⚠️  ERREUR: ${error.message.substring(0, 100)}...`);
        }
      } else {
        results.existing.push(func);
        console.log(`   ✅ FONCTION EXISTANTE (${data?.length || 'N/A'} résultats)`);
      }
    } catch (err) {
      results.errors.push({ ...func, error: err.message });
      console.log(`   💥 EXCEPTION: ${err.message.substring(0, 100)}...`);
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DES FONCTIONS RPC');
  console.log('='.repeat(80));

  console.log(`\n✅ FONCTIONS EXISTANTES (${results.existing.length}):`);
  results.existing.forEach(func => {
    console.log(`   • ${func.name} - ${func.category}`);
  });

  console.log(`\n❌ FONCTIONS MANQUANTES (${results.missing.length}):`);
  results.missing.forEach(func => {
    console.log(`   • ${func.name} - ${func.category}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n⚠️  FONCTIONS AVEC ERREURS (${results.errors.length}):`);
    results.errors.forEach(func => {
      console.log(`   • ${func.name} - ${func.error.substring(0, 80)}...`);
    });
  }

  // Plan d'action
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PLAN D\'ACTION POUR LE CRUD');
  console.log('='.repeat(80));

  const categories = {
    'Recommendations - CREATE': results.missing.filter(f => f.category === 'Recommendations - CREATE'),
    'Recommendations - UPDATE': results.missing.filter(f => f.category === 'Recommendations - UPDATE'),
    'Recommendations - DELETE': results.missing.filter(f => f.category === 'Recommendations - DELETE'),
    'Agri Rules - CREATE': results.missing.filter(f => f.category === 'Agri Rules - CREATE'),
    'Agri Rules - UPDATE': results.missing.filter(f => f.category === 'Agri Rules - UPDATE'),
    'Agri Rules - DELETE': results.missing.filter(f => f.category === 'Agri Rules - DELETE'),
    'Notifications - CREATE': results.missing.filter(f => f.category === 'Notifications - CREATE'),
    'Notifications - RESEND': results.missing.filter(f => f.category === 'Notifications - RESEND')
  };

  Object.entries(categories).forEach(([category, funcs]) => {
    if (funcs.length > 0) {
      console.log(`\n🔧 À IMPLÉMENTER - ${category}:`);
      funcs.forEach(func => {
        console.log(`   • ${func.name}`);
      });
    }
  });

  console.log('\n💡 RECOMMANDATIONS:');
  console.log('   1. Utilisez les fonctions existantes qui marchent');
  console.log('   2. Créez seulement les fonctions manquantes');
  console.log('   3. Testez chaque nouvelle fonction avant de l\'utiliser');
  console.log('   4. Évitez les conflits de noms de paramètres');

  return results;
}

listExistingRPCFunctions().catch(console.error);
