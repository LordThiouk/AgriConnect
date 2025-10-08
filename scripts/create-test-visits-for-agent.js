const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestVisits() {
  console.log('🔧 Création de visites de test pour l\'agent');
  console.log('='.repeat(50));

  try {
    // 1. Récupérer l'agent
    const { data: agent, error: agentError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name')
      .eq('user_id', 'b00a283f-0a46-41d2-af95-8a256c9c2771')
      .single();

    if (agentError) {
      console.error('❌ Erreur agent:', agentError);
      return;
    }
    console.log('✅ Agent trouvé:', agent);

    // 2. Récupérer des producteurs assignés
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('producer_id')
      .eq('agent_id', agent.id);

    if (assignmentsError) {
      console.error('❌ Erreur assignments:', assignmentsError);
      return;
    }

    if (assignments.length === 0) {
      console.log('⚠️ Aucun producteur assigné à cet agent');
      return;
    }

    console.log(`✅ ${assignments.length} producteurs assignés`);

    // 3. Récupérer les parcelles des producteurs
    const producerIds = assignments.map(a => a.producer_id);
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, producer_id, name_season_snapshot')
      .in('producer_id', producerIds);

    if (plotsError) {
      console.error('❌ Erreur parcelles:', plotsError);
      return;
    }

    console.log(`✅ ${plots.length} parcelles trouvées`);

    if (plots.length === 0) {
      console.log('⚠️ Aucune parcelle trouvée pour les producteurs assignés');
      return;
    }

    // 4. Créer des visites de test
    const testVisits = [
      {
        agent_id: agent.id,
        producer_id: plots[0].producer_id,
        plot_id: plots[0].id,
        visit_date: new Date().toISOString(),
        visit_type: 'routine',
        status: 'scheduled',
        duration_minutes: 30,
        notes: 'Visite de test créée automatiquement'
      },
      {
        agent_id: agent.id,
        producer_id: plots[0].producer_id,
        plot_id: plots[0].id,
        visit_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Hier
        visit_type: 'routine',
        status: 'completed',
        duration_minutes: 45,
        notes: 'Visite passée de test'
      },
      {
        agent_id: agent.id,
        producer_id: plots[0].producer_id,
        plot_id: plots[0].id,
        visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
        visit_type: 'routine',
        status: 'scheduled',
        duration_minutes: 60,
        notes: 'Visite future de test'
      }
    ];

    console.log('\n📝 Création des visites de test:');
    for (const visitData of testVisits) {
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert(visitData)
        .select()
        .single();

      if (visitError) {
        console.error('❌ Erreur création visite:', visitError);
      } else {
        console.log(`✅ Visite créée: ${visit.id} - ${visit.visit_date}`);
      }
    }

    // 5. Vérifier les visites créées
    console.log('\n🔍 Vérification des visites créées:');
    const { data: createdVisits, error: createdError } = await supabase
      .from('visits')
      .select('*')
      .eq('agent_id', agent.id);

    if (createdError) {
      console.error('❌ Erreur vérification:', createdError);
    } else {
      console.log(`✅ ${createdVisits.length} visites trouvées:`, createdVisits.map(v => ({
        id: v.id,
        visit_date: v.visit_date,
        status: v.status,
        notes: v.notes
      })));
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestVisits();
