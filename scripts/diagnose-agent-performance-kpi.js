import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function diagnoseAgentPerformanceKPI() {
  console.log('🔍 DIAGNOSTIC DES KPI PERFORMANCE AGENTS\n');
  console.log('='.repeat(70));

  try {
    // 1. Récupérer tous les agents
    console.log('\n1️⃣ Récupération des agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, is_active')
      .eq('role', 'agent')
      .eq('is_active', true);

    if (agentsError) {
      console.error('❌ Erreur:', agentsError.message);
      return;
    }

    console.log(`✅ ${agents.length} agents actifs trouvés\n`);

    // 2. Pour chaque agent, récupérer ses performances
    let totalVisitsThisMonth = 0;
    let totalOperations = 0;
    let totalObservations = 0;
    let totalPhotosPerPlot = 0;
    let agentCount = 0;

    console.log('2️⃣ Analyse des performances par agent...');
    console.log('-'.repeat(70));

    for (const agent of agents) {
      console.log(`\n📊 Agent: ${agent.display_name || 'Sans nom'} (${agent.id})`);

      // Appeler get_agent_performance
      const { data: perfData, error: perfError } = await supabase
        .rpc('get_agent_performance', { agent_id_param: agent.id });

      if (perfError) {
        console.log(`   ❌ Erreur RPC: ${perfError.message}`);
        continue;
      }

      const perf = Array.isArray(perfData) && perfData.length > 0 ? perfData[0] : null;

      if (!perf) {
        console.log('   ⚠️  Aucune donnée de performance');
        continue;
      }

      console.log(`   ✅ Performances récupérées:`);
      console.log(`      - Total visites: ${perf.total_visits || 0}`);
      console.log(`      - Visites ce mois: ${perf.visits_this_month || 0}`);
      console.log(`      - Total opérations: ${perf.total_operations || 0}`);
      console.log(`      - Total observations: ${perf.total_observations || 0}`);
      console.log(`      - Photos/parcelle: ${perf.photos_per_plot || 0}`);
      console.log(`      - Taux qualité: ${perf.data_quality_rate || 0}%`);

      // Cumuler pour les totaux
      totalVisitsThisMonth += Number(perf.visits_this_month || 0);
      totalOperations += Number(perf.total_operations || 0);
      totalObservations += Number(perf.total_observations || 0);
      totalPhotosPerPlot += Number(perf.photos_per_plot || 0);
      agentCount++;

      // Vérifier directement dans la base
      console.log(`\n   🔍 Vérification directe base de données:`);
      
      // Visites ce mois
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      console.log(`      - Visites ce mois (DB): ${visitsCount || 0}`);

      // Visites complétées ce mois
      const { count: completedCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'completed')
        .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      console.log(`      - Visites complétées (DB): ${completedCount || 0}`);

      // Opérations
      const { count: opsCount } = await supabase
        .from('operations')
        .select('*', { count: 'exact', head: true })
        .eq('agent_profile_id', agent.id);
      
      console.log(`      - Opérations (DB): ${opsCount || 0}`);

      // Observations
      const { count: obsCount } = await supabase
        .from('observations')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);
      
      console.log(`      - Observations (DB): ${obsCount || 0}`);
    }

    // 3. Afficher les totaux (comme dans le dashboard)
    console.log('\n\n3️⃣ TOTAUX AGRÉGÉS (comme KPI Cards Performance)');
    console.log('='.repeat(70));
    console.log(`   Agents Actifs:         ${agentCount}`);
    console.log(`   Visites ce Mois:       ${totalVisitsThisMonth}`);
    console.log(`   Total Opérations:      ${totalOperations}`);
    console.log(`   Total Observations:    ${totalObservations}`);
    console.log(`   Photos/Parcelle Moy:   ${agentCount > 0 ? (totalPhotosPerPlot / agentCount).toFixed(1) : 0}`);

    // 4. Comparaison avec les valeurs reportées
    console.log('\n\n4️⃣ COMPARAISON AVEC VALEURS REPORTÉES');
    console.log('='.repeat(70));
    console.log(`   Visites ce Mois:       Attendu: 0  | Calculé: ${totalVisitsThisMonth}`);
    console.log(`   Total Opérations:      Attendu: 4  | Calculé: ${totalOperations}`);
    console.log(`   Total Observations:    Attendu: 0  | Calculé: ${totalObservations}`);

    // 5. Diagnostic
    console.log('\n\n5️⃣ DIAGNOSTIC');
    console.log('='.repeat(70));
    
    if (totalVisitsThisMonth === 0) {
      console.log('⚠️  PROBLÈME: Visites ce mois = 0');
      console.log('   Causes possibles:');
      console.log('   1. get_agent_performance compte seulement les visites COMPLÉTÉES');
      console.log('   2. Aucune visite n\'a été complétée ce mois');
      console.log('   3. Les visites existent mais ne sont pas dans le mois en cours');
      
      // Vérifier les visites non complétées
      const { count: allVisitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      console.log(`\n   💡 Visites totales ce mois (tous statuts): ${allVisitsCount || 0}`);
      
      // Distribution par statut
      const { data: statusDist } = await supabase
        .from('visits')
        .select('status')
        .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      if (statusDist && statusDist.length > 0) {
        const byStatus = statusDist.reduce((acc, v) => {
          acc[v.status] = (acc[v.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n   📊 Distribution par statut:');
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`      - ${status}: ${count}`);
        });
      }
    }

    if (totalOperations !== 4) {
      console.log(`\n⚠️  INCOHÉRENCE: Opérations attendues: 4, calculées: ${totalOperations}`);
      console.log('   → Vérifier la colonne agent_profile_id dans la table operations');
    }

    console.log('\n✅ Diagnostic terminé\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error(error);
  }
}

diagnoseAgentPerformanceKPI();

