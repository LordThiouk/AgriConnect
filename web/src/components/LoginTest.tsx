/**
 * Composant de test pour la connexion - AgriConnect Web
 * Teste la connexion et affiche les informations de l'utilisateur
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const LoginTest: React.FC = () => {
  const { signIn, isAuthenticated, user, error, isLoading } = useAuth();
  const [testEmail, setTestEmail] = useState('admin@agriconnect.sn');
  const [testPassword, setTestPassword] = useState('admin123');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    userRole?: string;
  } | null>(null);

  const handleTestLogin = async () => {
    setTestResult(null);
    
    try {
      const result = await signIn(testEmail, testPassword);
      
      if (result.success) {
        setTestResult({
          success: true,
          message: 'Connexion réussie !',
          userRole: user?.user_metadata?.role
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erreur de connexion'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  };

  const testUsers = [
    { email: 'admin@agriconnect.sn', password: 'admin123', role: 'admin', description: 'Administrateur' },
    { email: 'supervisor@agriconnect.sn', password: 'supervisor123', role: 'supervisor', description: 'Superviseur' },
    { email: 'agent@agriconnect.sn', password: 'agent123', role: 'agent', description: 'Agent (devrait être bloqué)' },
    { email: 'producer@agriconnect.sn', password: 'producer123', role: 'producer', description: 'Producteur (devrait être bloqué)' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <LogIn className="w-5 h-5 mr-2" />
        Test de Connexion et Validation des Rôles
      </h3>

      {/* État actuel */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          État Actuel
        </h4>
        <div className="bg-gray-50 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Connecté:</span>
            <div className="flex items-center">
              {isAuthenticated ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? 'Oui' : 'Non'}
              </span>
            </div>
          </div>
          
          {user && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rôle:</span>
                <span className="font-semibold">{user.user_metadata?.role || 'Non défini'}</span>
              </div>
            </>
          )}
          
          {error && (
            <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Test de connexion */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Test de Connexion</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de test
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@agriconnect.sn"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe de test
            </label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin123"
            />
          </div>
          
          <button
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Tester la Connexion
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résultat du test */}
      {testResult && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Résultat du Test</h4>
          <div className={`p-4 rounded-md border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </span>
            </div>
            {testResult.userRole && (
              <p className="text-sm text-gray-600 mt-2">
                Rôle détecté: <strong>{testResult.userRole}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Utilisateurs de test prédéfinis */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Utilisateurs de Test</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testUsers.map((testUser, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setTestEmail(testUser.email);
                setTestPassword(testUser.password);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{testUser.description}</p>
                  <p className="text-xs text-gray-500">{testUser.email}</p>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600">{testUser.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Instructions de Test</h5>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Admin/Supervisor</strong> : Devrait pouvoir se connecter et accéder au dashboard</p>
          <p>2. <strong>Agent/Producer</strong> : Devrait pouvoir se connecter mais être bloqué par ProtectedRoute</p>
          <p>3. <strong>Vérification</strong> : La validation des rôles se fait après la connexion</p>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;
