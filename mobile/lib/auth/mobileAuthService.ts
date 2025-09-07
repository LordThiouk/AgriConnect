/**
 * Mobile Authentication Service - AgriConnect
 * Service d'authentification OTP SMS pour les Agents et Producteurs
 */

import { supabase } from '../supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface MobileAuthResult {
  user?: User | null;
  session?: Session | null;
  error?: AuthError | null;
}

export interface OtpResult {
  error?: AuthError | null;
}

export interface SessionResult {
  success: boolean;
  session?: Session | null;
  error?: string;
}

/**
 * Envoie un code OTP SMS au numéro de téléphone
 * @param phone - Numéro de téléphone au format international (+221XXXXXXXXX)
 * @returns Résultat de l'envoi
 */
export const sendOtpSms = async (phone: string): Promise<OtpResult> => {
  try {
    // Validation du format de téléphone sénégalais
    const phoneRegex = /^\+221[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        error: {
          message: 'Format de téléphone invalide. Utilisez le format +221XXXXXXXXX',
          status: 400,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms',
      },
    });

    return { error };
  } catch (error) {
    return {
      error: {
        message: 'Erreur lors de l\'envoi du SMS',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Vérifie le code OTP SMS
 * @param phone - Numéro de téléphone
 * @param token - Code OTP reçu par SMS
 * @returns Résultat de la vérification avec utilisateur et session
 */
export const verifyOtpSms = async (phone: string, token: string): Promise<MobileAuthResult> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: {
        message: 'Erreur lors de la vérification du code OTP',
        status: 500,
      } as AuthError,
    };
  }
};

/**
 * Déconnexion de l'utilisateur
 * @returns Résultat de la déconnexion
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erreur lors de la déconnexion'
    };
  }
};

/**
 * Obtient la session actuelle
 * @returns Résultat avec la session actuelle
 */
export const getCurrentSession = async (): Promise<SessionResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        session: null,
        error: error.message
      };
    }
    
    return {
      success: true,
      session: session,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      session: null,
      error: 'Erreur lors de la récupération de la session'
    };
  }
};

/**
 * Rafraîchit la session actuelle
 * @returns Résultat avec la nouvelle session
 */
export const refreshSession = async (): Promise<SessionResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return {
        success: false,
        session: null,
        error: error.message
      };
    }
    
    return {
      success: true,
      session: session,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      session: null,
      error: 'Erreur lors du rafraîchissement de la session'
    };
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 * @returns true si connecté, false sinon
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return false;
    return session !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Valide le format de numéro de téléphone sénégalais
 * @param phone - Numéro de téléphone à valider
 * @returns true si valide, false sinon
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+221[0-9]{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Formate un numéro de téléphone sénégalais
 * @param phone - Numéro de téléphone à formater
 * @returns Numéro formaté ou null si invalide
 */
export const formatPhoneNumber = (phone: string): string | null => {
  // Nettoyer le numéro (supprimer espaces, tirets, etc.)
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si commence par +221, vérifier la longueur
  if (cleaned.startsWith('+221') && cleaned.length === 13) {
    return cleaned;
  }
  
  // Si commence par 0, remplacer par +221
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+221${cleaned.substring(1)}`;
  }
  
  return null;
};

// Export de la classe MobileAuthService pour compatibilité
export class MobileAuthService {
  static async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    const result = await sendOtpSms(phone);
    return {
      success: !result.error,
      error: result.error?.message
    };
  }

  static async verifyOTP(phone: string, token: string): Promise<MobileAuthResult> {
    return await verifyOtpSms(phone, token);
  }

  static async getCurrentSession(): Promise<SessionResult> {
    return await getCurrentSession();
  }

  static async refreshSession(): Promise<SessionResult> {
    return await refreshSession();
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    return await signOut();
  }
}