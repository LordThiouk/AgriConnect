/**
 * Hook d'authentification mobile - AgriConnect
 * Hook personnalisé pour gérer l'authentification mobile avec validation des rôles
 */

import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../types/user';

export const useMobileAuth = () => {
  const auth = useAuth();

  // Fonctions utilitaires pour les rôles
  const isAgent = auth.userRole === 'agent';
  const isProducer = auth.userRole === 'producer';
  const isMobileUser = isAgent || isProducer;

  // Fonctions de validation
  const canAccess = (requiredRoles?: UserRole[]): boolean => {
    if (!auth.isAuthenticated || !auth.canAccessMobile) {
      return false;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return auth.userRole ? requiredRoles.includes(auth.userRole) : false;
  };

  const canManageProducers = (): boolean => {
    return canAccess(['agent']);
  };

  const canManagePlots = (): boolean => {
    return canAccess(['agent']);
  };

  const canManageCrops = (): boolean => {
    return canAccess(['agent']);
  };

  const canManageOperations = (): boolean => {
    return canAccess(['agent']);
  };

  const canManageObservations = (): boolean => {
    return canAccess(['agent']);
  };

  const canViewOwnData = (): boolean => {
    return canAccess(['agent', 'producer']);
  };

  // Informations sur l'utilisateur
  const getUserDisplayName = (): string => {
    if (!auth.user) return 'Utilisateur inconnu';
    
    const phone = auth.phone || 'Numéro inconnu';
    const role = auth.userRole || 'Rôle inconnu';
    
    return `${phone} (${role})`;
  };

  const getUserRoleDisplayName = (): string => {
    switch (auth.userRole) {
      case 'agent':
        return 'Agent de terrain';
      case 'producer':
        return 'Producteur';
      default:
        return 'Rôle inconnu';
    }
  };

  // État de l'authentification
  const authStatus = {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    canAccessMobile: auth.canAccessMobile,
    userRole: auth.userRole,
    phone: auth.phone,
    error: auth.error,
  };

  // Permissions
  const permissions = {
    canManageProducers: canManageProducers(),
    canManagePlots: canManagePlots(),
    canManageCrops: canManageCrops(),
    canManageOperations: canManageOperations(),
    canManageObservations: canManageObservations(),
    canViewOwnData: canViewOwnData(),
  };

  // Actions d'authentification
  const actions = {
    sendOTP: auth.sendOTP,
    verifyOTP: auth.verifyOTP,
    signOut: auth.signOut,
    clearError: auth.clearError,
    refreshSession: auth.refreshSession,
  };

  return {
    // État
    ...authStatus,
    
    // Rôles
    isAgent,
    isProducer,
    isMobileUser,
    
    // Permissions
    permissions,
    
    // Fonctions utilitaires
    canAccess,
    getUserDisplayName,
    getUserRoleDisplayName,
    
    // Actions
    ...actions,
  };
};

export default useMobileAuth;
