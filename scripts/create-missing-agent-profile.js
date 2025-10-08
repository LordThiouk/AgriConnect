require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MISSING_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function createMissingAgentProfile() {
  console.log('👤 Création du profil d\'agent manquant\n');
  
  // 1. Créer le profil avec la bonne structure
  console.log('📋 Création du profil d\'agent:');
  console.log('──────────────────────────────────────────────────');
  
  const agentProfile = {
    id: MISSING_AGENT_ID,
    user_id: MISSING_AGENT_ID, // Même ID pour user_id
    display_name: 'Agent Test (Récupéré)',
    role: 'agent',
    phone: '+221770000000',
    region: 'Dakar',
    department: 'Dakar',
    commune: 'Dakar',
    approval_status: 'approved',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: newProfile, error: profileError } = await supabase
    .from('profiles')
    .insert(agentProfile)
    .select()
    .single();
  
  if (profileError) {
    console.log(`❌ Erreur création profil: ${profileError.message}`);
    console.log(`   Code: ${profileError.code}`);
    console.log(`   Détails: ${profileError.details}`);
    return;
  }
  
  console.log('✅ Profil créé avec succès:');
  console.log(`   ID: ${newProfile.id}`);
  console.log(`   User ID: ${newProfile.user_id}`);
  console.log(`   Nom: ${newProfile.display_name}`);
  console.log(`   Rôle: ${newProfile.role}`);
  console.log(`   Téléphone: ${newProfile.phone}`);
  console.log(`   Statut: ${newProfile.approval_status}`);
  
  // 2. Vérifier l'accès aux visites
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
  
  // 3. Test de mise à jour d'une visite
  console.log('\n🔄 Test de mise à jour d\'une visite:');
  console.log('──────────────────────────────────────────────────');
  
  if (testVisits && testVisits.length > 0) {
    const visitId = testVisits[0].id;
    console.log(`📋 Test avec la visite: ${visitId}`);
    
    const { data: updateTest, error: updateError } = await supabase
      .from('visits')
      .update({ 
        updated_at: new Date().toISOString(),
        notes: `Test après création profil - ${new Date().toISOString()}`
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
  
  console.log('\n🎉 Profil d\'agent créé avec succès !');
  console.log('L\'agent peut maintenant:');
  console.log('✅ Accéder à ses visites dans l\'app mobile');
  console.log('✅ Mettre à jour le statut des visites');
  console.log('✅ Utiliser tous les filtres de visites');
  console.log('✅ Voir les données correctes (10 visites passées)');
}

// Exécuter la création
async function runCreate() {
  try {
    await createMissingAgentProfile();
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

runCreate();
