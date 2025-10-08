const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesStructure() {
  console.log('🔍 Vérification de la structure de la table profiles');
  console.log('='.repeat(50));

  try {
    // Récupérer un échantillon de données pour voir la structure
    const { data: sample, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erreur échantillon:', sampleError);
      return;
    }

    if (sample && sample.length > 0) {
      console.log('✅ Structure de la table profiles:');
      console.log('Colonnes disponibles:', Object.keys(sample[0]));
      console.log('\nExemple de données:');
      console.log(JSON.stringify(sample[0], null, 2));
    } else {
      console.log('⚠️ Aucune donnée dans la table profiles');
    }

    // Vérifier l'agent spécifique
    console.log('\n🔍 Vérification de l\'agent b00a283f-0a46-41d2-af95-8a256c9c2771:');
    const { data: agent, error: agentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', 'b00a283f-0a46-41d2-af95-8a256c9c2771')
      .single();

    if (agentError) {
      console.error('❌ Erreur agent:', agentError);
    } else {
      console.log('✅ Agent trouvé:', agent);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkProfilesStructure();