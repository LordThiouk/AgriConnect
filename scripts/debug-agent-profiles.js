require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_AGENT_ID = 'b00a283f-0a46-41d2-af95-8a256c9c2771';

async function debugAgentProfiles() {
  console.log('👤 Debug des profils d\'agent\n');
  
  // 1. Vérifier tous les profils avec cet ID
  console.log('📋 Recherche de tous les profils avec cet ID:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', TEST_AGENT_ID);
  
  if (allError) {
    console.log(`❌ Erreur: ${allError.message}`);
  } else {
    console.log(`✅ Profils trouvés: ${allProfiles?.length || 0}`);
    if (allProfiles && allProfiles.length > 0) {
      allProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`);
        console.log(`      Rôle: ${profile.role}`);
        console.log(`      Nom: ${profile.full_name}`);
        console.log(`      Téléphone: ${profile.phone}`);
        console.log(`      Créé: ${profile.created_at}`);
      });
    }
  }
  
  // 2. Vérifier les profils par rôle agent
  console.log('\n🔍 Recherche des profils avec rôle agent:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agentProfiles, error: agentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'agent');
  
  if (agentError) {
    console.log(`❌ Erreur: ${agentError.message}`);
  } else {
    console.log(`✅ Agents trouvés: ${agentProfiles?.length || 0}`);
    if (agentProfiles && agentProfiles.length > 0) {
      agentProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`);
        console.log(`      Nom: ${profile.full_name}`);
        console.log(`      Téléphone: ${profile.phone}`);
        console.log(`      Créé: ${profile.created_at}`);
      });
    }
  }
  
  // 3. Vérifier les visites de cet agent
  console.log('\n📅 Vérification des visites de cet agent:');
  console.log('──────────────────────────────────────────────────');
  
  const { data: agentVisits, error: visitsError } = await supabase
    .from('visits')
    .select('id, agent_id, status, visit_date, created_at')
    .eq('agent_id', TEST_AGENT_ID)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (visitsError) {
    console.log(`❌ Erreur: ${visitsError.message}`);
  } else {
    console.log(`✅ Visites trouvées: ${agentVisits?.length || 0}`);
    if (agentVisits && agentVisits.length > 0) {
      agentVisits.forEach((visit, index) => {
        console.log(`   ${index + 1}. ID: ${visit.id}`);
        console.log(`      Statut: ${visit.status}`);
        console.log(`      Date: ${visit.visit_date}`);
        console.log(`      Créée: ${visit.created_at}`);
      });
    }
  }
  
  // 4. Test de mise à jour avec différents agents
  console.log('\n🔄 Test de mise à jour avec différents agents:');
  console.log('──────────────────────────────────────────────────');
  
  if (agentProfiles && agentProfiles.length > 0) {
    for (const agent of agentProfiles.slice(0, 3)) {
      console.log(`\n👤 Test avec agent: ${agent.full_name} (${agent.id})`);
      
      const { data: testVisits, error: testError } = await supabase
        .from('visits')
        .select('id, status')
        .eq('agent_id', agent.id)
        .limit(1);
      
      if (testError) {
        console.log(`   ❌ Erreur récupération visites: ${testError.message}`);
      } else if (testVisits && testVisits.length > 0) {
        const visitId = testVisits[0].id;
        console.log(`   📋 Visite test: ${visitId}`);
        
        const { data: updateTest, error: updateError } = await supabase
          .from('visits')
          .update({ 
            updated_at: new Date().toISOString(),
            notes: `Test mise à jour - ${agent.full_name} - ${new Date().toISOString()}`
          })
          .eq('id', visitId)
          .select();
        
        if (updateError) {
          console.log(`   ❌ Erreur mise à jour: ${updateError.message}`);
        } else {
          console.log(`   ✅ Mise à jour OK: ${updateTest?.length || 0} ligne(s)`);
        }
      } else {
        console.log(`   ⚠️  Aucune visite trouvée pour cet agent`);
      }
    }
  }
}

// Exécuter le debug
async function runDebug() {
  try {
    await debugAgentProfiles();
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

runDebug();
