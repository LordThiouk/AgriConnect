import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import { createClient } from '@supabase/supabase-js';

interface TableStatus {
  table: string;
  exists: boolean;
  error: string | null;
  hasData: boolean;
}

const TestSupabase: React.FC = () => {
  console.log('🔍 TestSupabase component loaded');
  
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    data: any;
  } | null>(null);
  const [tablesStatus, setTablesStatus] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Variables d\'environnement Supabase manquantes');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Test de connexion de base
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('Erreur d\'authentification:', authError.message);
      }

      // Test de connexion à la base de données
      const { data, error } = await supabase
        .from('producers')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Erreur de connexion à la base de données: ${error.message}`);
      }

      console.log('✅ Connexion Supabase réussie');
      setConnectionStatus({
        success: true,
        message: 'Connexion Supabase réussie',
        data: data
      });
    } catch (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const testTables = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Variables d\'environnement Supabase manquantes');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const tables = ['producers', 'cooperatives', 'plots', 'crops', 'recommendations', 'profiles'];

      const results = await Promise.all(
        tables.map(async (table) => {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(1);

            return {
              table,
              exists: !error,
              error: error?.message || null,
              hasData: data && data.length > 0
            };
          } catch (err) {
            return {
              table,
              exists: false,
              error: err instanceof Error ? err.message : 'Erreur inconnue',
              hasData: false
            };
          }
        })
      );

      setTablesStatus(results);
    } catch (error) {
      console.error('Erreur lors de la vérification des tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Test automatique au chargement
    testConnection();
    testTables();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      <Header onMenuToggle={handleToggleSidebar} />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Test de Connexion Supabase</h1>
            <p className="text-gray-600 mt-2">Vérification de la connectivité et des tables de base de données</p>
          </div>

          <div className="grid gap-6">
            {/* Test de connexion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test de Connexion</span>
                  <Button 
                    onClick={testConnection} 
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? 'Test...' : 'Tester'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectionStatus && (
                  <div className="flex items-center space-x-3">
                    <Badge variant={connectionStatus.success ? 'default' : 'destructive'}>
                      {connectionStatus.success ? '✅ Succès' : '❌ Échec'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {connectionStatus.message}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test des tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vérification des Tables</span>
                  <Button 
                    onClick={testTables} 
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? 'Vérification...' : 'Vérifier'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tablesStatus.map((table) => (
                    <div key={table.table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{table.table}</span>
                        <Badge variant={table.exists ? 'default' : 'destructive'}>
                          {table.exists ? '✅ Existe' : '❌ Manquante'}
                        </Badge>
                        {table.exists && (
                          <Badge variant={table.hasData ? 'default' : 'secondary'}>
                            {table.hasData ? '📊 Données' : '📭 Vide'}
                          </Badge>
                        )}
                      </div>
                      {table.error && (
                        <span className="text-xs text-red-600 max-w-md truncate">
                          {table.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informations de configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">URL Supabase:</span>
                    <span className="font-mono">
                      {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clé Anonyme:</span>
                    <span className="font-mono">
                      {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode Mock:</span>
                    <span className="font-mono">
                      {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? '✅ Activé' : '❌ Désactivé'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>1. Assurez-vous que les variables d'environnement sont configurées dans le fichier <code className="bg-gray-100 px-2 py-1 rounded">.env</code></p>
                  <p>2. Vérifiez que votre projet Supabase est actif et accessible</p>
                  <p>3. Exécutez les migrations de base de données si nécessaire</p>
                  <p>4. Si les tables n'existent pas, utilisez l'outil de seed à <code className="bg-gray-100 px-2 py-1 rounded">/seed-data</code></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSupabase;
