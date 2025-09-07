// Script de diagnostic Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Diagnostic Supabase ===');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Présent' : 'Manquant');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuration Supabase manquante');
  console.log('Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('\n1. Test de connexion...');
    
    // Test de connexion basique
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return;
    }

    console.log('✅ Connexion Supabase réussie');

    // Test de la table producers
    console.log('\n2. Test de la table producers...');
    
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('*')
      .limit(5);

    if (producersError) {
      console.error('❌ Erreur table producers:', producersError);
      console.log('Vérifiez que la table "producers" existe et est accessible');
      return;
    }

    console.log('✅ Table producers accessible');
    console.log(`Nombre d'éléments récupérés: ${producers?.length || 0}`);

    if (producers && producers.length > 0) {
      console.log('Exemple de producteur:', producers[0]);
    }

    // Test de pagination
    console.log('\n3. Test de pagination...');
    
    const { data: paginatedData, error: paginationError, count } = await supabase
      .from('producers')
      .select('*', { count: 'exact' })
      .range(0, 9)
      .order('created_at', { ascending: false });

    if (paginationError) {
      console.error('❌ Erreur pagination:', paginationError);
      return;
    }

    console.log('✅ Pagination fonctionne');
    console.log(`Total: ${count}, Récupérés: ${paginatedData?.length || 0}`);

    // Test de filtrage
    console.log('\n4. Test de filtrage...');
    
    const { data: filteredData, error: filterError } = await supabase
      .from('producers')
      .select('*')
      .not('first_name', 'is', null)
      .limit(5);

    if (filterError) {
      console.error('❌ Erreur filtrage:', filterError);
      return;
    }

    console.log('✅ Filtrage fonctionne');
    console.log(`Éléments filtrés: ${filteredData?.length || 0}`);

    console.log('\n✅ Tous les tests Supabase sont réussis !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
testSupabaseConnection();
