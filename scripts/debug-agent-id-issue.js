const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAgentIdIssue() {
  console.log('🔍 Debug du problème d\'ID agent');
  console.log('='.repeat(50));

  try {
    const agentUserId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    
    // 1. Vérifier le profil agent
    console.log('\n1. 🔍 Vérification du profil agent:');
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('user_id', agentUserId)
      .eq('role', 'agent')
      .single();

    if (agentError) {
      console.error('❌ Erreur récupération profil:', agentError);
    } else {
      console.log('✅ Profil agent trouvé:', agentProfile);
    }

    // 2. Vérifier tous les profils avec ce user_id
    console.log('\n2. 🔍 Tous les profils avec ce user_id:');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role')
      .eq('user_id', agentUserId);

    if (allProfilesError) {
      console.error('❌ Erreur récupération tous profils:', allProfilesError);
    } else {
      console.log('✅ Tous les profils trouvés:', allProfiles);
    }

    // 3. Vérifier la fonction create_visit avec l'ID correct
    if (agentProfile) {
      console.log('\n3. 🔍 Test de create_visit avec l\'ID correct:');
      
      const { data: createResult, error: createError } = await supabase
        .rpc('create_visit', {
          p_agent_id: agentProfile.id, // Utiliser l'ID du profil, pas le user_id
          p_visit_data: {
            producer_id: '46a7297a-00fa-46cc-9b96-51b398aa9899',
            plot_id: '6203b6b6-f530-4971-b62d-26f4c570058c',
            visit_date: new Date().toISOString(),
            visit_type: 'routine',
            status: 'scheduled',
            duration_minutes: 30,
            notes: 'Test avec ID correct',
            weather_conditions: 'Ensoleillé'
          }
        });

      if (createError) {
        console.error('❌ Erreur create_visit:', createError);
      } else {
        console.log('✅ create_visit réussi:', createResult);
        
        // Nettoyer la visite créée
        if (createResult?.data?.id) {
          await supabase.rpc('delete_visit', { p_visit_id: createResult.data.id });
          console.log('🧹 Visite de test nettoyée');
        }
      }
    }

    // 4. Vérifier la différence entre user_id et id
    console.log('\n4. 🔍 Explication de la différence:');
    console.log('   - user_id: ID de l\'utilisateur dans auth.users (UUID)');
    console.log('   - id: ID du profil dans profiles (UUID différent)');
    console.log('   - La fonction create_visit attend l\'ID du profil (profiles.id)');
    console.log('   - Le mobile utilise user_id pour s\'authentifier');
    console.log('   - Il faut récupérer profiles.id à partir de profiles.user_id');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugAgentIdIssue();
