/**
 * Contexte d'authentification web - AgriConnect
 * Gère l'état d'authentification pour l'application web
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithPassword, 
  signUp as signUpService, 
  signOut as signOutService, 
  getCurrentUser, 
  getCurrentSession, 
  isAuthenticated,
  resetPassword,
  updatePassword
} from '../services/webAuthService';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '../../../types/user';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  // Actions d'authentification
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  getUserRole: () => string | null;
  isPlatformAllowed: () => boolean;
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
      
      const isAuth = await isAuthenticated();
      
      if (isAuth) {
        const user = await getCurrentUser();
        const session = await getCurrentSession();
        
        if (user && session) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: user,
            session: session,
            error: null
          });
        } else {
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            session: null,
            error: 'Session invalide'
          });
        }
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

  // Connexion
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const { user, session, error } = await signInWithPassword(email, password);
      
      if (error) {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: error.message || 'Connexion échouée'
        }));
        return { success: false, error: error.message || 'Erreur' };
      }

      if (user && session) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: user,
          session: session,
          error: null
        });

        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: 'Connexion échouée'
        }));
        return { success: false, error: 'Connexion échouée' };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const errorMessage = 'Erreur lors de la connexion';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Inscription
  const signUp = async (email: string, password: string, userData?: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const { user, session, error } = await signUpService(email, password, userData);
      
      if (error) {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: error.message || 'Inscription échouée'
        }));
        return { success: false, error: error.message || 'Erreur' };
      }

      if (user && session) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: user,
          session: session,
          error: null
        });

        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: 'Inscription échouée'
        }));
        return { success: false, error: 'Inscription échouée' };
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      const errorMessage = 'Erreur lors de l\'inscription';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Réinitialiser le mot de passe
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const { error } = await resetPassword(email);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Erreur';
        setState(prev => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      const errorMessage = 'Erreur lors de la réinitialisation du mot de passe';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Mettre à jour le mot de passe
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Erreur';
        setState(prev => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      const errorMessage = 'Erreur lors de la mise à jour du mot de passe';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Déconnexion
  const handleSignOut = async (reason?: string) => {
    try {
      // Appeler le service de déconnexion
      const { error } = await signOutService();
      
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
      
      // Mettre à jour l'état local
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: reason || null
      });
      
      // Log de déconnexion réussie
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setState(prev => ({ ...prev, error: 'Erreur lors de la déconnexion' }));
    }
  };

  const signOut = () => handleSignOut();

  // Obtenir le rôle de l'utilisateur
  const getUserRole = (): UserRole | null => {
    // D'abord vérifier dans user_metadata
    const metadataRole = state.user?.user_metadata?.role;
    if (metadataRole && ['admin', 'supervisor', 'agent', 'producer', 'coop_admin'].includes(metadataRole)) {
      return metadataRole as UserRole;
    }
    
    // Si pas trouvé, retourner null (le rôle sera récupéré depuis la table profiles dans ProtectedRoute)
    return null;
  };

  // Vérifier si la plateforme est autorisée
  const isPlatformAllowed = (): boolean => {
    const role = getUserRole();
    return role ? ['admin', 'supervisor', 'coop_admin'].includes(role) : false;
  };

  // Effacer l'erreur
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
    clearError,
    getUserRole,
    isPlatformAllowed
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