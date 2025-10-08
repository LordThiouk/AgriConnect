/**
 * Contexte d'authentification mobile - AgriConnect
 * Gère l'état d'authentification et les sessions pour l'application mobile
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MobileAuthService } from '../lib/auth/mobileAuthService';
import { SessionManager } from '../lib/auth/sessionManager';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '../../lib/types/core/user';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  canAccessMobile: boolean;
  phone: string | null;
  producerId: string | null; // Ajouter le producerId
  error: string | null;
}

export interface AuthContextType extends AuthState {
  // Actions d'authentification
  sendOTP: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  refreshSession: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    session: null,
    userRole: null,
    canAccessMobile: false,
    phone: null,
    producerId: null, // Initialiser
    error: null
  });

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    checkInitialAuth();
  }, []);

  // Vérifier l'authentification initiale
  const checkInitialAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const session = await SessionManager.getCurrentSession();
      
      if (session) {
        const userInfo = await MobileAuthService.getUserInfo(session.user, session);
        
        setState({
          isAuthenticated: userInfo.isAuthenticated,
          isLoading: false,
          user: userInfo.user,
          session: userInfo.session,
          userRole: userInfo.userRole,
          canAccessMobile: userInfo.canAccessMobile,
          phone: userInfo.phone,
          producerId: userInfo.producerId, // Mettre à jour
          error: null
        });

        // Démarrer la gestion automatique des sessions
        SessionManager.startAutoRefreshTimer(session);
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          userRole: null,
          canAccessMobile: false,
          phone: null,
          producerId: null, // Initialiser
          error: null
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        userRole: null,
        canAccessMobile: false,
        phone: null,
        producerId: null, // Initialiser
        error: 'Erreur lors de la vérification de l\'authentification'
      });
    }
  };

  // Envoyer un OTP
  const sendOTP = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const response = await MobileAuthService.sendOTP(phone);
      
      if (response.success) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: true };
      } else {
        setState(prev => ({ ...prev, error: response.error || 'Erreur lors de l\'envoi de l\'OTP', isLoading: false }));
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'OTP:', error);
      const errorMessage = 'Erreur lors de l\'envoi de l\'OTP';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Vérifier un OTP
  const verifyOTP = async (phone: string, token: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🎯 [CONTEXT] verifyOTP - Début avec téléphone:', phone, 'token:', token);
    
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      console.log('🎯 [CONTEXT] verifyOTP - Appel à MobileAuthService.verifyOTP...');
      const response = await MobileAuthService.verifyOTP(phone, token);
      
      console.log('🎯 [CONTEXT] verifyOTP - Réponse du service:', {
        success: response.success,
        hasUser: !!response.user,
        hasSession: !!response.session,
        error: response.error
      });
      
      if (response.success && response.user && response.session) {
        console.log('🎯 [CONTEXT] verifyOTP - Authentification réussie, récupération des infos utilisateur...');
        
        const userInfo = await MobileAuthService.getUserInfo(response.user, response.session);
        
        console.log('🎯 [CONTEXT] verifyOTP - Infos utilisateur:', {
          isAuthenticated: userInfo.isAuthenticated,
          userRole: userInfo.userRole,
          canAccessMobile: userInfo.canAccessMobile,
          phone: userInfo.phone
        });
        
        // Vérifier si l'utilisateur peut accéder au mobile
        if (!userInfo.canAccessMobile) {
          console.log('❌ [CONTEXT] verifyOTP - Accès refusé, rôle non autorisé:', userInfo.userRole);
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            session: null,
            userRole: null,
            canAccessMobile: false,
            phone: null,
            producerId: null, // Réinitialiser
            error: 'Accès refusé. Seuls les agents et producteurs peuvent utiliser l\'application mobile.'
          });
          return { success: false, error: 'Accès refusé. Seuls les agents et producteurs peuvent utiliser l\'application mobile.' };
        }
        
        console.log('✅ [CONTEXT] verifyOTP - Utilisateur autorisé, mise à jour de l\'état...');
        
        setState({
          isAuthenticated: userInfo.isAuthenticated,
          isLoading: false,
          user: userInfo.user,
          session: userInfo.session,
          userRole: userInfo.userRole,
          canAccessMobile: userInfo.canAccessMobile,
          phone: userInfo.phone,
          producerId: userInfo.producerId, // Mettre à jour
          error: null
        });

        // Démarrer la gestion automatique des sessions
        console.log('🎯 [CONTEXT] verifyOTP - Démarrage du timer de session...');
        SessionManager.startAutoRefreshTimer(response.session);
        
        console.log('✅ [CONTEXT] verifyOTP - Authentification complète réussie');
        return { success: true };
      } else {
        console.log('❌ [CONTEXT] verifyOTP - Échec de l\'authentification:', response.error);
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          userRole: null,
          canAccessMobile: false,
          phone: null,
          producerId: null, // Réinitialiser
          error: response.error || 'Session invalide'
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.log('❌ [CONTEXT] verifyOTP - Exception:', error);
      const errorMessage = 'Erreur lors de la vérification de l\'OTP';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Déconnexion
  const handleSignOut = async () => {
    try {
      // SessionManager.clearSession appelle déjà MobileAuthService.signOut
      await SessionManager.clearSession();
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        userRole: null,
        canAccessMobile: false,
        phone: null,
        producerId: null, // Réinitialiser
        error: null
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setState(prev => ({ ...prev, error: 'Erreur lors de la déconnexion' }));
    }
  };

  const signOut = () => handleSignOut();

  // Rafraîchir la session
  const refreshSession = async () => {
    try {
      const session = await SessionManager.refreshSession();
      
      if (session) {
        const userInfo = await MobileAuthService.getUserInfo(session.user, session);
        
        setState(prev => ({
          ...prev,
          user: userInfo.user,
          session: userInfo.session,
          userRole: userInfo.userRole,
          canAccessMobile: userInfo.canAccessMobile,
          phone: userInfo.phone,
          producerId: userInfo.producerId, // Mettre à jour
          error: null
        }));
      } else {
        // Session expirée, déconnecter l'utilisateur
        await handleSignOut();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      // En cas d'erreur, déconnecter l'utilisateur
      await handleSignOut();
    }
  };

  // Rafraîchir l'authentification complète
  const refreshAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const session = await SessionManager.getCurrentSession();
      
      if (session) {
        const userInfo = await MobileAuthService.getUserInfo(session.user, session);
        
        setState({
          isAuthenticated: userInfo.isAuthenticated,
          isLoading: false,
          user: userInfo.user,
          session: userInfo.session,
          userRole: userInfo.userRole,
          canAccessMobile: userInfo.canAccessMobile,
          phone: userInfo.phone,
          producerId: userInfo.producerId, // Mettre à jour
          error: null
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          userRole: null,
          canAccessMobile: false,
          phone: null,
          producerId: null, // Réinitialiser
          error: null
        });
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'authentification:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        userRole: null,
        canAccessMobile: false,
        phone: null,
        producerId: null, // Réinitialiser
        error: 'Erreur lors du rafraîchissement de l\'authentification'
      });
    }
  };

  // Effacer l'erreur
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    sendOTP,
    verifyOTP,
    signOut,
    clearError,
    refreshSession,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;