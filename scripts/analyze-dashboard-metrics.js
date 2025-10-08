import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function analyzeDashboardMetrics() {
  console.log('📊 ANALYSE DES MÉTRIQUES DASHBOARD AGRICONNECT\n');
  console.log('='.repeat(60));

  try {
    // 1. Producteurs
    console.log('\n1️⃣ PRODUCTEURS');
    console.log('-'.repeat(60));
    const { data: producers, error: prodError } = await supabase
      .from('producers')
      .select('id, first_name, last_name, cooperative_id, phone');
    
    if (prodError) {
      console.log('❌ Erreur:', prodError.message);
    } else {
      console.log(`✅ Total: ${producers.length} producteurs`);
      const withPhone = producers.filter(p => p.phone).length;
      const withCoop = producers.filter(p => p.cooperative_id).length;
      console.log(`   - Avec téléphone: ${withPhone}`);
      console.log(`   - Avec coopérative: ${withCoop}`);
    }

    // 2. Coopératives
    console.log('\n2️⃣ COOPÉRATIVES');
    console.log('-'.repeat(60));
    const { data: coops, error: coopError } = await supabase
      .from('cooperatives')
      .select('id, name, region');
    
    if (coopError) {
      console.log('❌ Erreur:', coopError.message);
    } else {
      console.log(`✅ Total: ${coops.length} coopératives`);
    }

    // 3. Parcelles
    console.log('\n3️⃣ PARCELLES');
    console.log('-'.repeat(60));
    const { data: plots, error: plotsError } = await supabase
      .from('farm_file_plots')
      .select('id, name_season_snapshot, farm_file_id');
    
    if (plotsError) {
      console.log('❌ Erreur:', plotsError.message);
    } else {
      console.log(`✅ Total: ${plots.length} parcelles`);
    }

    // 4. Agents
    console.log('\n4️⃣ AGENTS');
    console.log('-'.repeat(60));
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, approval_status')
      .eq('role', 'agent');
    
    if (agentsError) {
      console.log('❌ Erreur:', agentsError.message);
    } else {
      console.log(`✅ Total: ${agents.length} agents`);
      const approved = agents.filter(a => a.approval_status === 'approved').length;
      console.log(`   - Approuvés: ${approved}`);
      
      // Détails des agents
      console.log('\n   📋 Liste des agents:');
      agents.forEach((agent, index) => {
        console.log(`      ${index + 1}. ${agent.display_name} (${agent.approval_status})`);
      });
    }

    // 5. Assignations
    console.log('\n5️⃣ ASSIGNATIONS AGENTS');
    console.log('-'.repeat(60));
    const { data: assignments, error: assignError } = await supabase
      .from('agent_assignments')
      .select(`
        id,
        agent_id,
        assigned_to_type,
        assigned_to_id,
        profiles!agent_assignments_agent_id_fkey(display_name)
      `);
    
    if (assignError) {
      console.log('❌ Erreur:', assignError.message);
    } else {
      console.log(`✅ Total: ${assignments.length} assignations`);
      const producerAssignments = assignments.filter(a => a.assigned_to_type === 'producer').length;
      const coopAssignments = assignments.filter(a => a.assigned_to_type === 'cooperative').length;
      console.log(`   - Assignations producteur: ${producerAssignments}`);
      console.log(`   - Assignations coopérative: ${coopAssignments}`);
      
      if (assignments.length > 0) {
        console.log('\n   📋 Détails:');
        assignments.forEach((assign, index) => {
          console.log(`      ${index + 1}. ${assign.profiles?.display_name} → ${assign.assigned_to_type}`);
        });
      }
    }

    // 6. Visites
    console.log('\n6️⃣ VISITES');
    console.log('-'.repeat(60));
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select(`
        id,
        visit_date,
        status,
        visit_type,
        agent_id,
        producer_id,
        plot_id,
        profiles!visits_agent_id_fkey(display_name)
      `);
    
    if (visitsError) {
      console.log('❌ Erreur:', visitsError.message);
    } else {
      console.log(`✅ Total: ${visits.length} visites`);
      
      if (visits.length === 0) {
        console.log('   ⚠️  AUCUNE VISITE ENREGISTRÉE');
        console.log('   ℹ️  Raison possible: Aucune visite n\'a été créée par les agents');
      } else {
        const completed = visits.filter(v => v.status === 'completed').length;
        const inProgress = visits.filter(v => v.status === 'in_progress').length;
        const scheduled = visits.filter(v => v.status === 'scheduled').length;
        
        console.log(`   - Terminées: ${completed}`);
        console.log(`   - En cours: ${inProgress}`);
        console.log(`   - Planifiées: ${scheduled}`);
        
        // Visites par agent
        const visitsByAgent = {};
        visits.forEach(v => {
          const agentName = v.profiles?.display_name || 'Inconnu';
          visitsByAgent[agentName] = (visitsByAgent[agentName] || 0) + 1;
        });
        
        console.log('\n   📋 Visites par agent:');
        Object.entries(visitsByAgent).forEach(([agent, count]) => {
          console.log(`      - ${agent}: ${count}`);
        });
      }
    }

    // 7. Opérations
    console.log('\n7️⃣ OPÉRATIONS AGRICOLES');
    console.log('-'.repeat(60));
    const { data: operations, error: opsError } = await supabase
      .from('operations')
      .select('id, operation_type, operation_date, plot_id');
    
    if (opsError) {
      console.log('❌ Erreur:', opsError.message);
    } else {
      console.log(`✅ Total: ${operations.length} opérations`);
      
      if (operations.length > 0) {
        const opsByType = {};
        operations.forEach(op => {
          opsByType[op.operation_type] = (opsByType[op.operation_type] || 0) + 1;
        });
        
        console.log('\n   📋 Par type:');
        Object.entries(opsByType).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count}`);
        });
      }
    }

    // 8. Observations
    console.log('\n8️⃣ OBSERVATIONS');
    console.log('-'.repeat(60));
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('id, observation_type, severity, created_at');
    
    if (obsError) {
      console.log('❌ Erreur:', obsError.message);
    } else {
      console.log(`✅ Total: ${observations.length} observations`);
    }

    // 9. Recommandations
    console.log('\n9️⃣ RECOMMANDATIONS');
    console.log('-'.repeat(60));
    const { data: recommendations, error: recError } = await supabase
      .from('recommendations')
      .select('id, title, priority, status, created_at');
    
    if (recError) {
      console.log('❌ Erreur:', recError.message);
    } else {
      console.log(`✅ Total: ${recommendations.length} recommandations`);
      
      if (recommendations.length > 0) {
        const byPriority = {};
        recommendations.forEach(rec => {
          byPriority[rec.priority] = (byPriority[rec.priority] || 0) + 1;
        });
        
        console.log('\n   📋 Par priorité:');
        Object.entries(byPriority).forEach(([priority, count]) => {
          console.log(`      - ${priority}: ${count}`);
        });
      }
    }

    // 10. Diagnostic
    console.log('\n🔍 DIAGNOSTIC');
    console.log('='.repeat(60));
    
    if (visits.length === 0) {
      console.log('⚠️  PROBLÈME: Aucune visite enregistrée');
      console.log('\n💡 SOLUTIONS POSSIBLES:');
      console.log('   1. Créer des visites de test via le formulaire mobile');
      console.log('   2. Vérifier que les agents ont des producteurs assignés');
      console.log('   3. Exécuter un script de création de données de test');
    }
    
    if (operations.length === 0) {
      console.log('⚠️  PROBLÈME: Aucune opération enregistrée');
      console.log('   → Impact: Le calcul de qualité des données ne peut pas fonctionner');
    }
    
    if (assignments.length === 0) {
      console.log('⚠️  PROBLÈME: Aucune assignation agent');
      console.log('   → Impact: Les agents ne peuvent pas voir de producteurs');
    }

    console.log('\n✅ Analyse terminée\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

analyzeDashboardMetrics();

