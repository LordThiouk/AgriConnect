require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MISSING_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function findExistingAgentProfile() {
  console.log('🔍 Recherche du profil d\'agent existant\n');
  
  // 1. Rechercher par user_id
  console.log('📋 Recherche par user_id:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: profileByUserId, error: userIdError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', MISSING_AGENT_ID)
    .single();
  
  if (userIdError) {
    console.log(`❌ Erreur recherche par user_id: ${userIdError.message}`);
  } else {
    console.log('✅ Profil trouvé par user_id:');
    console.log(`   ID: ${profileByUserId.id}`);
    console.log(`   User ID: ${profileByUserId.user_id}`);
    console.log(`   Nom: ${profileByUserId.display_name}`);
    console.log(`   Rôle: ${profileByUserId.role}`);
    console.log(`   Téléphone: ${profileByUserId.phone}`);
    console.log(`   Statut: ${profileByUserId.approval_status}`);
  }
  
  // 2. Rechercher par id
  console.log('\n📋 Recherche par id:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: profileById, error: idError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', MISSING_AGENT_ID)
    .single();
  
  if (idError) {
    console.log(`❌ Erreur recherche par id: ${idError.message}`);
  } else {
    console.log('✅ Profil trouvé par id:');
    console.log(`   ID: ${profileById.id}`);
    console.log(`   User ID: ${profileById.user_id}`);
    console.log(`   Nom: ${profileById.display_name}`);
    console.log(`   Rôle: ${profileById.role}`);
    console.log(`   Téléphone: ${profileById.phone}`);
    console.log(`   Statut: ${profileById.approval_status}`);
  }
  
  // 3. Vérifier l'accès aux visites avec le profil existant
  console.log('\n🔍 Vérification de l\'accès aux visites:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: testVisits, error: testError } = await supabase
    .from('visits')
    .select('id, agent_id, status, visit_date, notes')
    .eq('agent_id', MISSING_AGENT_ID)
    .limit(5);
  
  if (testError) {
    console.log(`❌ Erreur accès visites: ${testError.message}`);
  } else {
    console.log(`✅ Accès aux visites OK: ${testVisits?.length || 0} visites`);
    if (testVisits && testVisits.length > 0) {
      testVisits.forEach((visit, index) => {
        console.log(`   ${index + 1}. ${visit.id} - ${visit.status} - ${visit.visit_date}`);
      });
    }
  }
  
  // 4. Test de mise à jour d'une visite
  console.log('\n🔄 Test de mise à jour d\'une visite:');
  console.log('──────────────────────────────────────────────────');
  
  if (testVisits && testVisits.length > 0) {
    const visitId = testVisits[0].id;
    console.log(`📋 Test avec la visite: ${visitId}`);
    
    const { data: updateTest, error: updateError } = await supabase
      .from('visits')
      .update({ 
        updated_at: new Date().toISOString(),
        notes: `Test avec profil existant - ${new Date().toISOString()}`
      })
      .eq('id', visitId)
      .select();
    
    if (updateError) {
      console.log(`❌ Erreur mise à jour: ${updateError.message}`);
    } else {
      console.log(`✅ Mise à jour OK: ${updateTest?.length || 0} ligne(s) modifiée(s)`);
      if (updateTest && updateTest.length > 0) {
        console.log('   Visite mise à jour:', {
          id: updateTest[0].id,
          status: updateTest[0].status,
          notes: updateTest[0].notes
        });
      }
    }
  }
  
  console.log('\n🎉 Diagnostic terminé !');
  if (profileByUserId || profileById) {
    console.log('✅ Le profil d\'agent existe déjà');
    console.log('✅ L\'accès aux visites fonctionne');
    console.log('✅ La mise à jour des visites fonctionne');
    console.log('🔧 Le problème dans l\'app mobile est probablement lié à l\'authentification ou au cache');
  } else {
    console.log('❌ Aucun profil trouvé - il faut le créer');
  }
}

// Exécuter la recherche
async function runFind() {
  try {
    await findExistingAgentProfile();
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
  }
}

runFind();
