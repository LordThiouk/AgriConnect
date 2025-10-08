require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVisitsRLSPolicies() {
  console.log('🔍 Vérification des politiques RLS de la table visits\n');
  
  // 1. Vérifier si RLS est activé
  console.log('📋 Vérification du statut RLS:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('check_table_rls', { table_name: 'visits' });
  
  if (rlsError) {
    console.log(`❌ Erreur vérification RLS: ${rlsError.message}`);
    
    // Essayer une requête directe
    const { data: rlsDirect, error: rlsDirectError } = await supabase
      .from('pg_class')
      .select('relrowsecurity')
      .eq('relname', 'visits');
    
    if (rlsDirectError) {
      console.log(`❌ Erreur vérification RLS directe: ${rlsDirectError.message}`);
    } else {
      console.log(`✅ RLS Status: ${rlsDirect?.[0]?.relrowsecurity ? 'Activé' : 'Désactivé'}`);
    }
  } else {
    console.log(`✅ RLS Status: ${rlsStatus ? 'Activé' : 'Désactivé'}`);
  }
  
  // 2. Lister les politiques existantes
  console.log('\n📜 Politiques RLS existantes:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'visits');
  
  if (policiesError) {
    console.log(`❌ Erreur récupération politiques: ${policiesError.message}`);
    
    // Essayer une requête alternative
    const { data: policiesAlt, error: policiesAltError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'visits' });
    
    if (policiesAltError) {
      console.log(`❌ Erreur récupération politiques alternative: ${policiesAltError.message}`);
    } else {
      console.log(`✅ Politiques trouvées: ${policiesAlt?.length || 0}`);
      if (policiesAlt && policiesAlt.length > 0) {
        policiesAlt.forEach((policy, index) => {
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
  
  // 3. Vérifier les permissions sur la table visits
  console.log('\n🔐 Vérification des permissions:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: permissions, error: permError } = await supabase
    .rpc('get_table_permissions', { table_name: 'visits' });
  
  if (permError) {
    console.log(`❌ Erreur récupération permissions: ${permError.message}`);
  } else {
    console.log(`✅ Permissions trouvées: ${permissions?.length || 0}`);
    if (permissions && permissions.length > 0) {
      permissions.forEach((perm, index) => {
        console.log(`   ${index + 1}. ${perm.grantee}: ${perm.privilege_type}`);
      });
    }
  }
  
  // 4. Test de création d'une politique RLS simple
  console.log('\n🛠️  Test de création d\'une politique RLS:');
  console.log('──────────────────────────────────────────────────');
  
  const createPolicySQL = `
    CREATE POLICY IF NOT EXISTS "agents_can_update_their_visits" 
    ON visits FOR UPDATE 
    TO authenticated 
    USING (agent_id = auth.uid())
    WITH CHECK (agent_id = auth.uid());
  `;
  
  const { data: createResult, error: createError } = await supabase
    .rpc('exec_sql', { sql: createPolicySQL });
  
  if (createError) {
    console.log(`❌ Erreur création politique: ${createError.message}`);
  } else {
    console.log('✅ Politique créée avec succès');
  }
  
  // 5. Vérifier les politiques après création
  console.log('\n📋 Vérification des politiques après création:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: policiesAfter, error: policiesAfterError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'visits');
  
  if (policiesAfterError) {
    console.log(`❌ Erreur récupération politiques après: ${policiesAfterError.message}`);
  } else {
    console.log(`✅ Politiques après création: ${policiesAfter?.length || 0}`);
    if (policiesAfter && policiesAfter.length > 0) {
      policiesAfter.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname}: ${policy.cmd}`);
        console.log(`      Expression: ${policy.qual}`);
      });
    }
  }
  
  console.log('\n🎯 RÉSUMÉ:');
  console.log('──────────────────────────────────────────────────');
  console.log('Le problème est que les politiques RLS bloquent l\'accès aux visites');
  console.log('pour les utilisateurs authentifiés avec la clé ANON.');
  console.log('Il faut créer des politiques appropriées pour permettre aux agents');
  console.log('de lire et modifier leurs propres visites.');
}

// Exécuter la vérification
async function runCheck() {
  try {
    await checkVisitsRLSPolicies();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

runCheck();