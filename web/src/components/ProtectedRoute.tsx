/**
 * Composant de protection des routes - AgriConnect Web
 * Vérifie l'authentification et les permissions avant d'afficher le contenu
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../../../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
  allowDebugAccess?: boolean; // Permet l'accès même sans permissions web
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback,
  allowDebugAccess = false
}) => {
  const { isAuthenticated, isLoading, user, getUserRole, isPlatformAllowed } = useAuth();
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Récupérer le rôle depuis la table profiles si nécessaire
  useEffect(() => {
    if (isAuthenticated && user && !getUserRole()) {
      loadProfileRole();
    }
  }, [isAuthenticated, user, getUserRole]);

  const loadProfileRole = async () => {
    if (!user) return;
    
    try {
      setRoleLoading(true);
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
    } finally {
      setRoleLoading(false);
    }
  };

  // Fonction pour obtenir le rôle effectif
  const getEffectiveRole = (): UserRole | null => {
    return getUserRole() || profileRole;
  };

  // Fonction pour vérifier si la plateforme est autorisée
  const isPlatformAllowedEffective = (): boolean => {
    const role = getEffectiveRole();
    return role ? ['admin', 'supervisor', 'coop_admin'].includes(role) : false;
  };

  // Affichage du chargement
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
              <div className="w-10 h-10 text-red-600 text-2xl">🔒</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à cette page
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  // Vérifier si la plateforme est autorisée (sauf pour debug)
  if (!isPlatformAllowedEffective() && !allowDebugAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
              <div className="w-10 h-10 text-red-600 text-2xl">💻</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Plateforme non autorisée
          </h2>
          <p className="text-gray-600 mb-4">
            Votre rôle ne vous permet pas d'accéder à l'interface web
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            Veuillez utiliser l'application mobile pour accéder à vos données
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              <strong>Rôle actuel :</strong> {getEffectiveRole()}
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Les agents et producteurs utilisent l'application mobile
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/debug"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              🔍 Voir les détails de debug
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier le rôle requis si spécifié
  if (requiredRole) {
    const userRole = getEffectiveRole();
    if (userRole !== requiredRole) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                <div className="w-10 h-10 text-red-600 text-2xl">🛡️</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Permissions insuffisantes
            </h2>
            <p className="text-gray-600 mb-4">
              Cette page nécessite le rôle <strong>{requiredRole}</strong>
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>Votre rôle :</strong> {userRole}
              </p>
              <p className="text-red-700 text-sm mt-1">
                Contactez votre administrateur pour obtenir les permissions nécessaires
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Retour au tableau de bord
            </a>
          </div>
        </div>
      );
    }
  }

  // Toutes les vérifications sont passées, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
