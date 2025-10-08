const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisitRPCs() {
  console.log('🔍 Vérification des RPCs de visites disponibles');
  console.log('='.repeat(50));

  try {
    // 1. Tester get_agent_today_visits
    console.log('\n1. Test de get_agent_today_visits:');
    const { data: todayVisits, error: todayError } = await supabase
      .rpc('get_agent_today_visits', {
        p_agent_id: 'b00a283f-0a46-41d2-af95-8a256c9c2771'
      });

    if (todayError) {
      console.error('❌ Erreur get_agent_today_visits:', todayError);
    } else {
      console.log(`✅ get_agent_today_visits retourne ${todayVisits.length} visites:`, todayVisits);
    }

    // 2. Tester get_agent_all_visits_with_filters avec les bons paramètres
    console.log('\n2. Test de get_agent_all_visits_with_filters (p_filter, p_user_id):');
    const { data: allVisits, error: allError } = await supabase
      .rpc('get_agent_all_visits_with_filters', {
        p_filter: 'all',
        p_user_id: 'b00a283f-0a46-41d2-af95-8a256c9c2771'
      });

    if (allError) {
      console.error('❌ Erreur get_agent_all_visits_with_filters:', allError);
    } else {
      console.log(`✅ get_agent_all_visits_with_filters retourne ${allVisits.length} visites:`, allVisits);
    }

    // 3. Vérifier les visites directement dans la table
    console.log('\n3. Visites directes dans la table:');
    const { data: directVisits, error: directError } = await supabase
      .from('visits')
      .select(`
        *,
        producer:producers(first_name, last_name),
        plot:plots(name_season_snapshot, area_hectares)
      `)
      .eq('agent_id', '0f33842a-a1f1-4ad5-8113-39285e5013df');

    if (directError) {
      console.error('❌ Erreur visites directes:', directError);
    } else {
      console.log(`✅ ${directVisits.length} visites trouvées directement:`, directVisits);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkVisitRPCs();
