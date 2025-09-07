/**
 * Composant de test pour la validation des rôles - AgriConnect Web
 * Affiche les informations de l'utilisateur et teste la validation des rôles
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Monitor, Smartphone, CheckCircle, XCircle } from 'lucide-react';

const RoleTest: React.FC = () => {
  const { user, isAuthenticated, getUserRole, isPlatformAllowed } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Utilisateur non connecté</span>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();
  const platformAllowed = isPlatformAllowed();
  const isWebRole = userRole && ['admin', 'supervisor'].includes(userRole);
  const isMobileRole = userRole && ['agent', 'producer'].includes(userRole);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Test de Validation des Rôles
      </h3>

      {/* Informations utilisateur */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          Informations Utilisateur
        </h4>
        <div className="bg-gray-50 rounded-md p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">ID:</span>
            <span className="font-mono text-sm">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-mono text-sm">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rôle:</span>
            <span className="font-semibold">{userRole || 'Non défini'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Créé le:</span>
            <span className="text-sm">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Tests de validation */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Tests de Validation</h4>

        {/* Test plateforme autorisée */}
        <div className="flex items-center justify-between p-3 rounded-md border">
          <div className="flex items-center">
            <Monitor className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Plateforme Web Autorisée</span>
          </div>
          <div className="flex items-center">
            {platformAllowed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`ml-2 text-sm font-medium ${platformAllowed ? 'text-green-600' : 'text-red-600'}`}>
              {platformAllowed ? 'Autorisé' : 'Non autorisé'}
            </span>
          </div>
        </div>

        {/* Test rôle web */}
        <div className="flex items-center justify-between p-3 rounded-md border">
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Rôle Web (Admin/Supervisor)</span>
          </div>
          <div className="flex items-center">
            {isWebRole ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`ml-2 text-sm font-medium ${isWebRole ? 'text-green-600' : 'text-red-600'}`}>
              {isWebRole ? 'Valide' : 'Invalide'}
            </span>
          </div>
        </div>

        {/* Test rôle mobile */}
        <div className="flex items-center justify-between p-3 rounded-md border">
          <div className="flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Rôle Mobile (Agent/Producer)</span>
          </div>
          <div className="flex items-center">
            {isMobileRole ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`ml-2 text-sm font-medium ${isMobileRole ? 'text-green-600' : 'text-red-600'}`}>
              {isMobileRole ? 'Valide' : 'Invalide'}
            </span>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Recommandations</h5>
        <div className="text-sm text-blue-700 space-y-1">
          {!platformAllowed && (
            <p>• Votre rôle "{userRole}" n'est pas autorisé sur l'interface web</p>
          )}
          {isMobileRole && (
            <p>• Vous devriez utiliser l'application mobile AgriConnect</p>
          )}
          {!userRole && (
            <p>• Aucun rôle défini. Contactez votre administrateur</p>
          )}
          {isWebRole && (
            <p>• Accès web autorisé. Vous pouvez utiliser cette interface</p>
          )}
        </div>
      </div>

      {/* Métadonnées utilisateur */}
      {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
        <div className="mt-6">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Métadonnées Utilisateur</h5>
          <div className="bg-gray-50 rounded-md p-3">
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTest;
