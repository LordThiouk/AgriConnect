const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

async function debugMobileAuth() {
  console.log('🔍 Debug de l\'authentification mobile...');
  
  try {
    // Récupérer tous les utilisateurs avec leurs profils
    console.log('\n1️⃣ Liste de tous les utilisateurs avec leurs profils...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        display_name,
        role,
        phone,
        created_at
      `)
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Erreur lors de la récupération des profils:', profilesError);
      return;
    }
    
    console.log('📋 Profils trouvés:', profiles.length);
    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.display_name || 'Sans nom'}`);
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - User ID: ${profile.user_id}`);
      console.log(`   - Rôle: ${profile.role}`);
      console.log(`   - Téléphone: ${profile.phone || 'Non renseigné'}`);
      console.log(`   - Créé le: ${profile.created_at}`);
    });
    
    // Identifier les agents
    const agents = profiles.filter(p => p.role === 'agent');
    console.log(`\n👥 Agents trouvés: ${agents.length}`);
    
    // Tester les parcelles pour chaque agent
    console.log('\n2️⃣ Test des parcelles pour chaque agent...');
    for (const agent of agents) {
      console.log(`\n🧪 Test pour ${agent.display_name || 'Sans nom'} (${agent.user_id})...`);
      
      const { data: plots, error: rpcError } = await supabase
        .rpc('get_agent_plots_with_geolocation', {
          p_agent_user_id: agent.user_id
        });

      if (rpcError) {
        console.log(`❌ Erreur RPC pour ${agent.display_name}:`, rpcError.message);
        continue;
      }

      console.log(`✅ Parcelles trouvées pour ${agent.display_name}:`, plots?.length || 0);
      
      if (plots && plots.length > 0) {
        console.log(`   Exemple: ${plots[0].name_season_snapshot} (${plots[0].producer_name})`);
      }
    }
    
    // Vérifier les utilisateurs récents (ceux qui pourraient être connectés dans l'app)
    console.log('\n3️⃣ Utilisateurs récents (potentiellement connectés)...');
    const recentProfiles = profiles
      .filter(p => p.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 derniers jours
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log('📅 Profils créés dans les 7 derniers jours:', recentProfiles.length);
    recentProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.display_name || 'Sans nom'}`);
      console.log(`   - User ID: ${profile.user_id}`);
      console.log(`   - Rôle: ${profile.role}`);
      console.log(`   - Créé le: ${profile.created_at}`);
    });
    
    // Suggestions pour l'utilisateur
    console.log('\n4️⃣ Suggestions pour résoudre le problème...');
    console.log('🔍 Vérifiez dans l\'app mobile:');
    console.log('   1. Quel user_id est affiché dans les logs ?');
    console.log('   2. Quel rôle est affiché (userRole) ?');
    console.log('   3. L\'utilisateur est-il bien connecté ?');
    console.log('\n💡 Si l\'utilisateur n\'est pas un agent, il faut:');
    console.log('   - Soit changer son rôle en "agent"');
    console.log('   - Soit se connecter avec un compte agent');
    console.log('\n💡 Si l\'agent n\'a pas de parcelles, il faut:');
    console.log('   - Vérifier ses assignations dans agent_assignments');
    console.log('   - Vérifier que les producteurs assignés ont des parcelles');
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
  }
}

debugMobileAuth();
