/**
 * Web Authentication Service - AgriConnect
 * Service d'authentification Email/Password pour les Admins et Superviseurs
 */

import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface WebAuthResult {
  user?: User | null;
  session?: Session | null;
  error?: AuthError | null;
}

export interface SignUpResult {
  user?: User | null;
  session?: Session | null;
  error?: AuthError | null;
}

/**
 * Connexion avec email et mot de passe
 * @param email - Adresse email
 * @param password - Mot de passe
 * @returns Résultat de la connexion
 */
export const signInWithPassword = async (email: string, password: string): Promise<WebAuthResult> => {
  try {
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        error: {
          message: 'Format d\'email invalide',
          status: 400,
        } as AuthError,
      };
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return {
        error: {
          message: 'Le mot de passe doit contenir au moins 6 caractères',
          status: 400,
        } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de la connexion',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Inscription avec email et mot de passe
 * @param email - Adresse email
 * @param password - Mot de passe
 * @param userData - Données utilisateur supplémentaires (nom, rôle, etc.)
 * @returns Résultat de l'inscription
 */
export const signUp = async (
  email: string, 
  password: string, 
  userData?: {
    full_name?: string;
    role?: 'admin' | 'supervisor' | 'coop_admin';
  }
): Promise<SignUpResult> => {
  try {
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        error: {
          message: 'Format d\'email invalide',
          status: 400,
        } as AuthError,
      };
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return {
        error: {
          message: 'Le mot de passe doit contenir au moins 6 caractères',
          status: 400,
        } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: userData?.full_name || '',
          role: userData?.role || 'supervisor',
        },
      },
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de l\'inscription',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Déconnexion de l'utilisateur
 * @returns Résultat de la déconnexion
 */
export const signOut = async (): Promise<{ error?: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de la déconnexion',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns Utilisateur actuel ou null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

/**
 * Récupère la session actuelle
 * @returns Session actuelle ou null
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 * @returns true si connecté, false sinon
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return session !== null;
};

/**
 * Réinitialise le mot de passe
 * @param email - Adresse email
 * @returns Résultat de la demande de réinitialisation
 */
export const resetPassword = async (email: string): Promise<{ error?: AuthError | null }> => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        error: {
          message: 'Format d\'email invalide',
          status: 400,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de la demande de réinitialisation',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Met à jour le mot de passe de l'utilisateur connecté
 * @param newPassword - Nouveau mot de passe
 * @returns Résultat de la mise à jour
 */
export const updatePassword = async (newPassword: string): Promise<{ error?: AuthError | null }> => {
  try {
    if (newPassword.length < 6) {
      return {
        error: {
          message: 'Le mot de passe doit contenir au moins 6 caractères',
          status: 400,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de la mise à jour du mot de passe',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Valide le format d'email
 * @param email - Email à valider
 * @returns true si valide, false sinon
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide la force du mot de passe
 * @param password - Mot de passe à valider
 * @returns true si fort, false sinon
 */
export const validatePasswordStrength = (password: string): boolean => {
  // Au moins 6 caractères, une majuscule, une minuscule, un chiffre
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return strongPasswordRegex.test(password);
};