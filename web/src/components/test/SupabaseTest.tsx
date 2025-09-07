import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SupabaseTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testConnection = async () => {
    setLoading(true);
    clearResults();
    
    addResult('🔍 Début des tests Supabase');
    addResult(`URL: ${supabaseUrl}`);
    addResult(`Anon Key: ${supabaseAnonKey ? 'Présent' : 'Manquant'}`);

    if (!supabaseUrl || !supabaseAnonKey) {
      addResult('❌ Configuration Supabase manquante');
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      // Test 1: Connexion basique
      addResult('1. Test de connexion...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        addResult(`❌ Erreur de connexion: ${error.message}`);
        setLoading(false);
        return;
      }

      addResult('✅ Connexion Supabase réussie');

      // Test 2: Table producers
      addResult('2. Test de la table producers...');
      const { data: producers, error: producersError } = await supabase
        .from('producers')
        .select('*')
        .limit(5);

      if (producersError) {
        addResult(`❌ Erreur table producers: ${producersError.message}`);
        addResult('Vérifiez que la table "producers" existe et est accessible');
        setLoading(false);
        return;
      }

      addResult(`✅ Table producers accessible`);
      addResult(`Nombre d'éléments récupérés: ${producers?.length || 0}`);

      if (producers && producers.length > 0) {
        addResult(`Exemple: ${producers[0].first_name} ${producers[0].last_name}`);
      }

      // Test 3: Pagination
      addResult('3. Test de pagination...');
      const { data: paginatedData, error: paginationError, count } = await supabase
        .from('producers')
        .select('*', { count: 'exact' })
        .range(0, 9)
        .order('created_at', { ascending: false });

      if (paginationError) {
        addResult(`❌ Erreur pagination: ${paginationError.message}`);
        setLoading(false);
        return;
      }

      addResult(`✅ Pagination fonctionne`);
      addResult(`Total: ${count}, Récupérés: ${paginatedData?.length || 0}`);

      // Test 4: Filtrage
      addResult('4. Test de filtrage...');
      const { data: filteredData, error: filterError } = await supabase
        .from('producers')
        .select('*')
        .not('first_name', 'is', null)
        .limit(5);

      if (filterError) {
        addResult(`❌ Erreur filtrage: ${filterError.message}`);
      } else {
        addResult(`✅ Filtrage fonctionne`);
        addResult(`Éléments filtrés: ${filteredData?.length || 0}`);
      }

      addResult('✅ Tous les tests Supabase sont réussis !');

    } catch (error) {
      addResult(`❌ Erreur générale: ${error}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Connexion Supabase</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Test en cours...' : 'Lancer les tests'}
        </button>
        
        <button
          onClick={clearResults}
          className="ml-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Effacer
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-gray-500">Cliquez sur "Lancer les tests" pour commencer...</div>
        ) : (
          results.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
