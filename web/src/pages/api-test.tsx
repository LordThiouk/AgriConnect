import React, { useState } from 'react';
import { producersService, authService } from '../../../lib/services/api';

const ApiTestPage: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const isAuth = authService.isAuthenticated();
      setTestResult(`Statut d'authentification: ${isAuth ? 'Authentifié' : 'Non authentifié'}`);
    } catch (error) {
      setTestResult(`Erreur de test d'auth: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testProducersAPI = async () => {
    setLoading(true);
    try {
      const response = await producersService.getAll({ limit: 5 });
      setTestResult(`Test API Producteurs réussi ! Trouvé ${response.data.length} producteurs. Pagination: ${JSON.stringify(response.pagination)}`);
    } catch (error) {
      setTestResult(`Erreur de test API Producteurs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateProducer = async () => {
    setLoading(true);
    try {
      const testData = {
        first_name: 'Test',
        last_name: 'Producteur',
        phone: '+221123456789',
        cooperative_id: 'test-coop-id',
        region: 'Région Test',
        department: 'Département Test',
        commune: 'Commune Test',
        village: 'Village Test',
        gender: 'M' as const,
        birth_date: null,
        education_level: null,
        household_size: 1,
        farming_experience_years: 0,
        primary_language: null,
        address: null,
        email: null,
        is_active: true,
        profile_id: null
      };

      const response = await producersService.create(testData);
      setTestResult(`Test de création de producteur réussi ! Réponse: ${JSON.stringify(response)}`);
    } catch (error) {
      setTestResult(`Erreur de test de création de producteur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test d'Intégration API</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test d'Authentification</h2>
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Tester le Statut d'Auth
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test API Producteurs</h2>
            <button
              onClick={testProducersAPI}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mr-4"
            >
              Tester Récupération Producteurs
            </button>
            <button
              onClick={testCreateProducer}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Tester Création Producteur
            </button>
          </div>

          {testResult && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Résultats des Tests</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Test en cours...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
