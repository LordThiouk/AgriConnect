const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVisitCreationIssues() {
  console.log('🔍 Debug des problèmes de création de visite');
  console.log('='.repeat(50));

  try {
    const agentUserId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    
    // 1. Vérifier l'agent et son profil
    console.log('\n1. 🔍 Vérification de l\'agent:');
    console.log('─'.repeat(30));
    
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, role, display_name')
      .eq('user_id', agentUserId)
      .single();

    if (agentError) {
      console.error('❌ Erreur récupération profil agent:', agentError);
    } else {
      console.log('✅ Profil agent trouvé:');
      console.log(`   ID: ${agentProfile.id}`);
      console.log(`   User ID: ${agentProfile.user_id}`);
      console.log(`   Rôle: ${agentProfile.role}`);
      console.log(`   Nom: ${agentProfile.display_name}`);
    }

    // 2. Vérifier les producteurs assignés à cet agent
    console.log('\n2. 👥 Vérification des producteurs assignés:');
    console.log('─'.repeat(30));
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select(`
        id,
        agent_id,
        assigned_to_id,
        producers!inner(
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('agent_id', agentProfile?.id);

    if (assignmentsError) {
      console.error('❌ Erreur récupération assignations:', assignmentsError);
    } else {
      console.log(`✅ ${assignments?.length || 0} producteurs assignés`);
      assignments?.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.producers.first_name} ${assignment.producers.last_name} (${assignment.producers.phone})`);
      });
    }

    // 3. Vérifier les parcelles d'un producteur
    if (assignments && assignments.length > 0) {
      const testProducerId = assignments[0].assigned_to_id;
      console.log(`\n3. 🌾 Vérification des parcelles du producteur ${testProducerId}:`);
      console.log('─'.repeat(30));
      
      const { data: plots, error: plotsError } = await supabase
        .from('plots')
        .select('id, name_season_snapshot, area_hectares, soil_type, water_source, status')
        .eq('producer_id', testProducerId);

      if (plotsError) {
        console.error('❌ Erreur récupération parcelles:', plotsError);
      } else {
        console.log(`✅ ${plots?.length || 0} parcelles trouvées`);
        plots?.forEach((plot, index) => {
          console.log(`   ${index + 1}. ${plot.name_season_snapshot}`);
          console.log(`      Superficie: ${plot.area_hectares} ha`);
          console.log(`      Sol: ${plot.soil_type || 'Non spécifié'}`);
          console.log(`      Eau: ${plot.water_source || 'Non spécifié'}`);
          console.log(`      Statut: ${plot.status}`);
        });
      }

      // 4. Tester la création d'une visite
      if (plots && plots.length > 0) {
        console.log(`\n4. 📝 Test de création de visite:`);
        console.log('─'.repeat(30));
        
        const testPlot = plots[0];
        const visitData = {
          producer_id: testProducerId,
          plot_id: testPlot.id,
          visit_date: new Date().toISOString(),
          visit_type: 'routine',
          status: 'scheduled',
          duration_minutes: 30,
          notes: 'Test de création de visite - ' + new Date().toISOString(),
          weather_conditions: 'Ensoleillé'
        };

        console.log('📋 Données de visite:');
        console.log(`   Producteur: ${testProducerId}`);
        console.log(`   Parcelle: ${testPlot.name_season_snapshot} (${testPlot.id})`);
        console.log(`   Agent (user_id): ${agentUserId}`);
        console.log(`   Agent (profile_id): ${agentProfile?.id}`);

        const { data: createResult, error: createError } = await supabase
          .rpc('create_visit', {
            p_agent_id: agentUserId, // Utiliser user_id
            p_visit_data: visitData
          });

        if (createError) {
          console.error('❌ Erreur création visite:', createError);
          
          // Essayer avec profile_id
          console.log('\n🔄 Tentative avec profile_id:');
          const { data: createResult2, error: createError2 } = await supabase
            .rpc('create_visit', {
              p_agent_id: agentProfile?.id, // Utiliser profile_id
              p_visit_data: visitData
            });

          if (createError2) {
            console.error('❌ Erreur création visite avec profile_id:', createError2);
          } else {
            console.log('✅ Visite créée avec profile_id:', createResult2);
            
            // Nettoyer
            if (createResult2?.data?.id) {
              await supabase.rpc('delete_visit', { p_visit_id: createResult2.data.id });
              console.log('🧹 Visite de test supprimée');
            }
          }
        } else {
          console.log('✅ Visite créée avec user_id:', createResult);
          
          // Nettoyer
          if (createResult?.data?.id) {
            await supabase.rpc('delete_visit', { p_visit_id: createResult.data.id });
            console.log('🧹 Visite de test supprimée');
          }
        }
      }
    }

    // 5. Vérifier le RPC get_plots_by_producer
    console.log('\n5. 🔍 Test du RPC get_plots_by_producer:');
    console.log('─'.repeat(30));
    
    if (assignments && assignments.length > 0) {
      const testProducerId = assignments[0].assigned_to_id;
      
      const { data: plotsRpc, error: plotsRpcError } = await supabase
        .rpc('get_plots_by_producer', {
          p_producer_id: testProducerId
        });

      if (plotsRpcError) {
        console.error('❌ Erreur RPC get_plots_by_producer:', plotsRpcError);
      } else {
        console.log(`✅ RPC get_plots_by_producer: ${plotsRpc?.length || 0} parcelles`);
        plotsRpc?.forEach((plot, index) => {
          console.log(`   ${index + 1}. ${plot.name || 'N/A'} (${plot.area_hectares || 'N/A'} ha)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugVisitCreationIssues();
