/**
 * Composant de Debug - Rôle Utilisateur
 * Affiche les informations de debug pour diagnostiquer les problèmes d'accès
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, User, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const UserRoleDebug: React.FC = () => {
  const { user, isAuthenticated, getUserRole, isPlatformAllowed } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? 'Valide' : 'Invalide';
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">Vous devez être connecté pour voir les informations de debug</p>
          </div>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();
  const platformAllowed = isPlatformAllowed();
  
  // Récupérer le rôle depuis la table profiles si nécessaire
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    if (isAuthenticated && user && !userRole) {
      loadProfileRole();
    }
  }, [isAuthenticated, user, userRole]);

  const loadProfileRole = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return;
      }

      if (profile?.role && ['admin', 'supervisor', 'agent', 'producer', 'coop_admin'].includes(profile.role)) {
        setProfileRole(profile.role as UserRole);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rôle:', error);
    }
  };

  const getEffectiveRole = (): UserRole | null => {
    return userRole || profileRole;
  };

  const isPlatformAllowedEffective = (): boolean => {
    const role = getEffectiveRole();
    return role ? ['admin', 'supervisor', 'coop_admin'].includes(role) : false;
  };
  const webAllowedRoles = ['admin', 'supervisor', 'coop_admin'];
  const mobileOnlyRoles = ['agent', 'producer'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug - Rôle Utilisateur</h1>
        <p className="text-gray-600">Diagnostic des problèmes d'accès et de permissions</p>
      </div>

      {/* Informations utilisateur */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <User className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Informations Utilisateur</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email/Téléphone</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email || user?.phone || 'Non défini'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Utilisateur</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Créé le</label>
            <p className="mt-1 text-sm text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Non défini'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dernière connexion</label>
            <p className="mt-1 text-sm text-gray-900">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Non défini'}
            </p>
          </div>
        </div>
      </div>

      {/* Métadonnées utilisateur */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Database className="w-6 h-6 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Métadonnées Utilisateur</h2>
        </div>
        
        <div className="bg-gray-50 rounded-md p-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(user?.user_metadata, null, 2)}
          </pre>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Rôle dans user_metadata</label>
          <div className="mt-1 flex items-center">
            {getStatusIcon(!!user?.user_metadata?.role)}
            <span className="ml-2 text-sm text-gray-900">
              {user?.user_metadata?.role || '❌ Non défini'}
            </span>
          </div>
        </div>
      </div>

      {/* Profil base de données */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Database className="w-6 h-6 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Profil Base de Données</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Chargement du profil...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">Erreur: {error}</p>
            </div>
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle</label>
              <div className="mt-1 flex items-center">
                {getStatusIcon(!!profile.role)}
                <span className="ml-2 text-sm text-gray-900">{profile.role || '❌ Non défini'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom d'affichage</label>
              <p className="mt-1 text-sm text-gray-900">{profile.display_name || '❌ Non défini'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Région</label>
              <p className="mt-1 text-sm text-gray-900">{profile.region || '❌ Non définie'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Coopérative</label>
              <p className="mt-1 text-sm text-gray-900">{profile.cooperative || '❌ Non définie'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">Aucun profil trouvé pour cet utilisateur</p>
            </div>
          </div>
        )}
      </div>

      {/* Vérification des permissions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Vérification des Permissions</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <p className="font-medium text-gray-900">Rôle effectif</p>
              <p className="text-sm text-gray-600">
                {getEffectiveRole() || '❌ Non défini'}
              </p>
            </div>
            {getStatusIcon(!!getEffectiveRole())}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <p className="font-medium text-gray-900">Accès web autorisé</p>
              <p className="text-sm text-gray-600">
                {isPlatformAllowedEffective() ? '✅ Autorisé' : '❌ Non autorisé'}
              </p>
            </div>
            {getStatusIcon(isPlatformAllowedEffective())}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <p className="font-medium text-gray-900">Rôles web autorisés</p>
              <p className="text-sm text-gray-600">{webAllowedRoles.join(', ')}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <p className="font-medium text-gray-900">Rôles mobile uniquement</p>
              <p className="text-sm text-gray-600">{mobileOnlyRoles.join(', ')}</p>
            </div>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Suggestions de correction */}
      {!isPlatformAllowedEffective() && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Suggestions de Correction</h2>
          </div>
          
          <div className="space-y-4">
            {!getEffectiveRole() ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800 mb-2">Problème: Aucun rôle défini</h3>
                <p className="text-red-700 text-sm mb-3">
                  Votre compte n'a pas de rôle défini. Contactez votre administrateur pour définir un rôle.
                </p>
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-600 font-mono">
                    SQL: UPDATE profiles SET role = 'admin' WHERE user_id = '{user?.id}';
                  </p>
                </div>
              </div>
            ) : mobileOnlyRoles.includes(getEffectiveRole()!) ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Problème: Rôle mobile uniquement</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Votre rôle actuel ({getEffectiveRole()}) ne permet que l'accès mobile.
                  Pour accéder à l'interface web, vous devez avoir un rôle: admin, supervisor, ou coop_admin.
                </p>
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-600 font-mono">
                    SQL: UPDATE profiles SET role = 'admin' WHERE user_id = '{user?.id}';
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-800 mb-2">Rôle non reconnu</h3>
                <p className="text-blue-700 text-sm">
                  Votre rôle ({getEffectiveRole()}) n'est pas reconnu par le système.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="mt-6 text-center">
        <button
          onClick={loadProfile}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Rafraîchir les informations
        </button>
      </div>
    </div>
  );
};

export default UserRoleDebug;
