import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { mockProducers } from '../../data/mockProducers';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DataSeeder: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const seedData = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      addResult('❌ Configuration Supabase manquante');
      return;
    }

    setLoading(true);
    clearResults();
    
    addResult('🌱 Début de l\'insertion des données de test...');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      // Vérifier si des données existent déjà
      const { count, error: countError } = await supabase
        .from('producers')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        addResult(`❌ Erreur lors de la vérification: ${countError.message}`);
        setLoading(false);
        return;
      }

      if (count && count > 0) {
        addResult(`ℹ️  ${count} producteurs existent déjà dans la base`);
      }

      // Préparer les données pour l'insertion
      const producersToInsert = mockProducers.map(producer => ({
        id: producer.id,
        cooperative_id: producer.cooperative_id,
        first_name: producer.first_name,
        last_name: producer.last_name,
        phone: producer.phone,
        email: producer.email,
        region: producer.region,
        department: producer.department,
        commune: producer.commune,
        is_active: producer.is_active,
        created_at: producer.created_at,
        updated_at: producer.updated_at
      }));

      addResult(`📝 Insertion de ${producersToInsert.length} producteurs...`);

      // Insérer par lots de 50 pour éviter les limites
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < producersToInsert.length; i += batchSize) {
        const batch = producersToInsert.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('producers')
          .insert(batch);

        if (error) {
          addResult(`❌ Erreur lors de l'insertion du lot ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          continue;
        }

        inserted += batch.length;
        addResult(`✅ Lot ${Math.floor(i / batchSize) + 1} inséré: ${batch.length} producteurs`);
      }

      addResult(`🎉 Insertion terminée: ${inserted} producteurs insérés`);

      // Vérifier l'insertion
      const { count: finalCount, error: finalError } = await supabase
        .from('producers')
        .select('*', { count: 'exact', head: true });

      if (finalError) {
        addResult(`❌ Erreur lors de la vérification finale: ${finalError.message}`);
      } else {
        addResult(`📊 Total final dans la base: ${finalCount} producteurs`);
      }

    } catch (error) {
      addResult(`❌ Erreur générale: ${error}`);
    }

    setLoading(false);
  };

  const clearData = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      addResult('❌ Configuration Supabase manquante');
      return;
    }

    setLoading(true);
    clearResults();
    
    addResult('🗑️ Suppression de toutes les données...');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { error } = await supabase
        .from('producers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous les enregistrements

      if (error) {
        addResult(`❌ Erreur lors de la suppression: ${error.message}`);
      } else {
        addResult('✅ Toutes les données ont été supprimées');
      }
    } catch (error) {
      addResult(`❌ Erreur générale: ${error}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion des Données de Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <button
            onClick={seedData}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Insertion en cours...' : 'Insérer les données de test'}
          </button>
          
          <button
            onClick={clearData}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Suppression en cours...' : 'Supprimer toutes les données'}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Effacer les logs
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-gray-500">Cliquez sur un bouton pour commencer...</div>
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

export default DataSeeder;
