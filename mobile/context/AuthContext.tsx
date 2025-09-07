/**
 * Contexte d'authentification mobile - AgriConnect
 * Gère l'état d'authentification et les sessions pour l'application mobile
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MobileAuthService, MobileAuthResponse } from '../lib/auth/mobileAuthService';
import { SessionManager } from '../lib/auth/sessionManager';
import type { AuthSession, User } from '@supabase/supabase-js';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: AuthSession | null;
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
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: session.user,
          session: session,
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
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const response = await MobileAuthService.verifyOTP(phone, token);
      
      if (response.success && response.user && response.session) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          session: response.session,
          error: null
        });

        // Démarrer la gestion automatique des sessions
        SessionManager.startAutoRefreshTimer(response.session);
        
        return { success: true };
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: response.error || 'Session invalide'
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'OTP:', error);
      const errorMessage = 'Erreur lors de la vérification de l\'OTP';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Déconnexion
  const handleSignOut = async () => {
    try {
      await MobileAuthService.signOut();
      await SessionManager.clearSession();
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
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
        setState(prev => ({
          ...prev,
          user: session.user,
          session: session,
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
    refreshSession
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