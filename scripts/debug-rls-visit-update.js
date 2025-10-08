require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

const PROBLEMATIC_VISIT_ID = 'b07b4943-a7e9-4039-b357-0d454064f9fa';
const AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function debugRLSVisitUpdate() {
  console.log('🔍 Debug RLS pour la mise à jour des visites\n');
  
  // 1. Test avec la clé anon (comme l'app mobile)
  console.log('📱 Test avec la clé ANON (comme l\'app mobile):');
  console.log('──────────────────────────────────────────────────');
  
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test de lecture
  const { data: readAnon, error: readAnonError } = await supabaseAnon
    .from('visits')
    .select('id, agent_id, status, visit_date')
    .eq('id', PROBLEMATIC_VISIT_ID);
  
  if (readAnonError) {
    console.log(`❌ Erreur lecture ANON: ${readAnonError.message}`);
  } else {
    console.log(`✅ Lecture ANON OK: ${readAnon?.length || 0} ligne(s)`);
    if (readAnon && readAnon.length > 0) {
      console.log('   Visite trouvée:', readAnon[0]);
    }
  }
  
  // Test de mise à jour avec ANON
  const { data: updateAnon, error: updateAnonError } = await supabaseAnon
    .from('visits')
    .update({ 
      updated_at: new Date().toISOString(),
      notes: `Test ANON - ${new Date().toISOString()}`
    })
    .eq('id', PROBLEMATIC_VISIT_ID)
    .select();
  
  if (updateAnonError) {
    console.log(`❌ Erreur mise à jour ANON: ${updateAnonError.message}`);
    console.log(`   Code: ${updateAnonError.code}`);
    console.log(`   Détails: ${updateAnonError.details}`);
    console.log(`   Hint: ${updateAnonError.hint}`);
  } else {
    console.log(`✅ Mise à jour ANON OK: ${updateAnon?.length || 0} ligne(s)`);
    if (updateAnon && updateAnon.length > 0) {
      console.log('   Visite mise à jour:', updateAnon[0]);
    }
  }
  
  // 2. Test avec la clé service (comme nos scripts)
  console.log('\n🔧 Test avec la clé SERVICE (comme nos scripts):');
  console.log('──────────────────────────────────────────────────');
  
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test de lecture
  const { data: readService, error: readServiceError } = await supabaseService
    .from('visits')
    .select('id, agent_id, status, visit_date')
    .eq('id', PROBLEMATIC_VISIT_ID);
  
  if (readServiceError) {
    console.log(`❌ Erreur lecture SERVICE: ${readServiceError.message}`);
  } else {
    console.log(`✅ Lecture SERVICE OK: ${readService?.length || 0} ligne(s)`);
    if (readService && readService.length > 0) {
      console.log('   Visite trouvée:', readService[0]);
    }
  }
  
  // Test de mise à jour avec SERVICE
  const { data: updateService, error: updateServiceError } = await supabaseService
    .from('visits')
    .update({ 
      updated_at: new Date().toISOString(),
      notes: `Test SERVICE - ${new Date().toISOString()}`
    })
    .eq('id', PROBLEMATIC_VISIT_ID)
    .select();
  
  if (updateServiceError) {
    console.log(`❌ Erreur mise à jour SERVICE: ${updateServiceError.message}`);
  } else {
    console.log(`✅ Mise à jour SERVICE OK: ${updateService?.length || 0} ligne(s)`);
    if (updateService && updateService.length > 0) {
      console.log('   Visite mise à jour:', updateService[0]);
    }
  }
  
  // 3. Vérifier les politiques RLS
  console.log('\n📜 Vérification des politiques RLS:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: policies, error: policiesError } = await supabaseService
    .rpc('get_table_policies', { table_name: 'visits' });
  
  if (policiesError) {
    console.log(`❌ Erreur récupération politiques: ${policiesError.message}`);
    
    // Essayer une requête directe
    const { data: policiesDirect, error: policiesDirectError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'visits');
    
    if (policiesDirectError) {
      console.log(`❌ Erreur récupération politiques directe: ${policiesDirectError.message}`);
    } else {
      console.log(`✅ Politiques trouvées: ${policiesDirect?.length || 0}`);
      if (policiesDirect && policiesDirect.length > 0) {
        policiesDirect.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname}: ${policy.cmd}`);
          console.log(`      Expression: ${policy.qual}`);
        });
      }
    }
  } else {
    console.log(`✅ Politiques trouvées: ${policies?.length || 0}`);
    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname}: ${policy.cmd}`);
        console.log(`      Expression: ${policy.qual}`);
      });
    }
  }
  
  // 4. Vérifier l'authentification de l'agent
  console.log('\n🔐 Vérification de l\'authentification:');
  console.log('──────────────────────────────────────────────────');
  
  // Simuler l'authentification avec l'agent
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'test@example.com', // Email fictif
    password: 'test123'
  });
  
  if (authError) {
    console.log(`❌ Erreur authentification: ${authError.message}`);
    console.log('   L\'app mobile doit être authentifiée pour accéder aux visites');
  } else {
    console.log('✅ Authentification simulée');
  }
  
  console.log('\n🎯 DIAGNOSTIC:');
  console.log('──────────────────────────────────────────────────');
  if (updateAnonError) {
    console.log('❌ PROBLÈME: L\'app mobile ne peut pas mettre à jour les visites');
    console.log('🔧 SOLUTION: Vérifier l\'authentification et les politiques RLS');
    console.log('📱 L\'utilisateur doit être connecté avec un compte valide');
  } else {
    console.log('✅ L\'app mobile peut mettre à jour les visites');
  }
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugRLSVisitUpdate();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
