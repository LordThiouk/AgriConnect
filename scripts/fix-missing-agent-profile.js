require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MISSING_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function fixMissingAgentProfile() {
  console.log('🔧 Correction du profil d\'agent manquant\n');
  
  // 1. Vérifier les visites de cet agent
  console.log('📋 Vérification des visites de l\'agent manquant:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, status, visit_date, created_at')
    .eq('agent_id', MISSING_AGENT_ID)
    .order('created_at', { ascending: false });
  
  if (visitsError) {
    console.log(`❌ Erreur: ${visitsError.message}`);
    return;
  }
  
  console.log(`✅ Visites trouvées: ${visits?.length || 0}`);
  if (visits && visits.length > 0) {
    console.log('   Détails des visites:');
    visits.slice(0, 3).forEach((visit, index) => {
      console.log(`   ${index + 1}. ID: ${visit.id}`);
      console.log(`      Statut: ${visit.status}`);
      console.log(`      Date: ${visit.visit_date}`);
    });
  }
  
  // 2. Créer le profil d'agent manquant
  console.log('\n👤 Création du profil d\'agent manquant:');
  console.log('──────────────────────────────────────────────────');
  
  const agentProfile = {
    id: MISSING_AGENT_ID,
    role: 'agent',
    full_name: 'Agent Test (Récupéré)',
    phone: '+221770000000',
    region: 'Dakar',
    department: 'Dakar',
    commune: 'Dakar',
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
  } else {
    console.log('✅ Profil créé avec succès:');
    console.log(`   ID: ${newProfile.id}`);
    console.log(`   Rôle: ${newProfile.role}`);
    console.log(`   Nom: ${newProfile.full_name}`);
    console.log(`   Téléphone: ${newProfile.phone}`);
  }
  
  // 3. Vérifier que les visites sont maintenant accessibles
  console.log('\n🔍 Vérification de l\'accès aux visites:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: testVisits, error: testError } = await supabase
    .from('visits')
    .select('id, agent_id, status, visit_date')
    .eq('agent_id', MISSING_AGENT_ID)
    .limit(3);
  
  if (testError) {
    console.log(`❌ Erreur accès visites: ${testError.message}`);
  } else {
    console.log(`✅ Accès aux visites OK: ${testVisits?.length || 0} visites`);
    if (testVisits && testVisits.length > 0) {
      testVisits.forEach((visit, index) => {
        console.log(`   ${index + 1}. ${visit.id} - ${visit.status}`);
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
  
  console.log('\n🎉 Correction terminée !');
  console.log('L\'agent devrait maintenant pouvoir accéder à ses visites dans l\'app mobile.');
}

// Exécuter la correction
async function runFix() {
  try {
    await fixMissingAgentProfile();
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

runFix();
