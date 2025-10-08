/**
 * Mobile Authentication Service - AgriConnect
 * Service d'authentification OTP SMS pour les Agents et Producteurs
 */

import { supabase } from '../supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { UserRole } from '../../../lib/types/core/user';

/**
 * Normalise le numéro de téléphone au format E.164
 * @param phone - Numéro de téléphone (format variable)
 * @returns Numéro normalisé au format +221XXXXXXXXX
 */
const normalizePhoneNumber = (phone: string): string => {
  // Supprimer tous les espaces, tirets et caractères spéciaux
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si le numéro commence par 221, ajouter le +
  if (cleaned.startsWith('221')) {
    cleaned = '+' + cleaned;
  }
  // Si le numéro commence par 0, remplacer par +221
  else if (cleaned.startsWith('0')) {
    cleaned = '+221' + cleaned.substring(1);
  }
  // Si le numéro ne commence pas par +, ajouter +221
  else if (!cleaned.startsWith('+')) {
    cleaned = '+221' + cleaned;
  }
  
  console.log('📱 [AUTH] normalizePhoneNumber - Original:', phone, 'Normalisé:', cleaned);
  return cleaned;
};

export interface MobileAuthResult {
  user?: User | null;
  session?: Session | null;
  error?: AuthError | null;
  success?: boolean;
}

export interface OtpResult {
  error?: AuthError | null;
  success?: boolean;
}

export interface SessionResult {
  success: boolean;
  session?: Session | null;
  error?: string;
}

export interface MobileAuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  userRole?: UserRole | null;
}

/**
 * Envoie un code OTP SMS au numéro de téléphone
 * @param phone - Numéro de téléphone au format international (+221XXXXXXXXX)
 * @returns Résultat de l'envoi
 */
export const sendOtpSms = async (phone: string): Promise<OtpResult> => {
  console.log('🔐 [AUTH] sendOtpSms - Début avec téléphone:', phone);
  
  // Normaliser le format du numéro de téléphone
  const normalizedPhone = normalizePhoneNumber(phone);
  console.log('📱 [AUTH] sendOtpSms - Téléphone normalisé:', normalizedPhone);
  
  try {
    // Validation du format de téléphone sénégalais
    const phoneRegex = /^\+221[0-9]{9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      console.log('❌ [AUTH] sendOtpSms - Format téléphone invalide:', normalizedPhone);
      return {
        success: false,
        error: {
          message: 'Format de téléphone invalide. Utilisez le format +221XXXXXXXXX',
          status: 400,
        } as AuthError,
      };
    }

    // Utiliser l'authentification normale de Supabase
    console.log('🔄 [AUTH] sendOtpSms - Utilisation de l\'authentification Supabase normale...');

    console.log('✅ [AUTH] sendOtpSms - Format téléphone valide, envoi OTP via Twilio...');
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.log('❌ [AUTH] sendOtpSms - Erreur Supabase/Twilio:', error);
    } else {
      console.log('✅ [AUTH] sendOtpSms - OTP envoyé avec succès via Twilio');
    }

    return { 
      success: !error,
      error: error || undefined
    };
  } catch (error) {
    console.log('❌ [AUTH] sendOtpSms - Exception:', error);
    return {
      success: false,
      error: {
        message: 'Erreur lors de l\'envoi du SMS via Twilio',
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
  console.log('🔐 [AUTH] verifyOtpSms - Début avec téléphone:', phone, 'token:', token);
  
  // Normaliser le format du numéro de téléphone
  const normalizedPhone = normalizePhoneNumber(phone);
  console.log('📱 [AUTH] verifyOtpSms - Téléphone normalisé:', normalizedPhone);
  
  try {
    // Utiliser l'authentification normale de Supabase
    console.log('🔄 [AUTH] verifyOtpSms - Utilisation de l\'authentification Supabase normale...');

    console.log('🔐 [AUTH] verifyOtpSms - Appel à supabase.auth.verifyOtp...');
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: token,
      type: 'sms',
    });

    console.log('🔐 [AUTH] verifyOtpSms - Réponse Supabase:');
    console.log('  - data.user:', data.user ? '✅ Présent' : '❌ Absent');
    console.log('  - data.session:', data.session ? '✅ Présent' : '❌ Absent');
    console.log('  - error:', error ? `❌ ${error.message}` : '✅ Aucune erreur');

    if (error) {
      console.log('❌ [AUTH] verifyOtpSms - Erreur détaillée:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
    }

    if (data.user) {
      console.log('👤 [AUTH] verifyOtpSms - Utilisateur créé:', {
        id: data.user.id,
        phone: data.user.phone,
        created_at: data.user.created_at,
        metadata: data.user.user_metadata
      });
    }

    const result = {
      success: !error && !!data.user && !!data.session,
      user: data.user,
      session: data.session,
      error: error || undefined,
    };

    console.log('🔐 [AUTH] verifyOtpSms - Résultat final:', {
      success: result.success,
      hasUser: !!result.user,
      hasSession: !!result.session,
      hasError: !!result.error
    });

    return result;
  } catch (error) {
    console.log('❌ [AUTH] verifyOtpSms - Exception:', error);
    return {
      success: false,
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
  } catch {
    return {
      success: false,
      error: 'Erreur lors de la déconnexion'
    };
  }
};

/**
 * Supprime tous les tokens et données d'authentification
 * @returns Résultat de la suppression
 */
export const clearAllTokens = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧹 [AUTH] clearAllTokens - Suppression de tous les tokens...');
    
    // 1. Déconnexion Supabase
    await supabase.auth.signOut();
    
    // 2. Supprimer les données AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
        'supabase.auth.token',
        'supabase.auth.refresh_token',
        'user_session',
        'user_profile',
        'user_role',
        'auth_state',
        'expo-secure-store.supabase.auth.token',
        'expo-secure-store.supabase.auth.refresh_token'
      ]);
      console.log('✅ [AUTH] clearAllTokens - AsyncStorage nettoyé');
    } catch (storageError) {
      console.log('⚠️ [AUTH] clearAllTokens - Erreur AsyncStorage:', storageError);
    }
    
    // 3. Supprimer les cookies (pour le web)
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('✅ [AUTH] clearAllTokens - Cookies supprimés');
    }
    
    console.log('✅ [AUTH] clearAllTokens - Tous les tokens supprimés');
    
    return {
      success: true,
      error: undefined
    };
  } catch (error) {
    console.error('❌ [AUTH] clearAllTokens - Erreur:', error);
    return {
      success: false,
      error: 'Erreur lors de la suppression des tokens'
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
  } catch {
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
  } catch {
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
  
  console.log('📱 [AUTH] formatPhoneNumber - Input:', phone, 'Cleaned:', cleaned);
  
  // Si commence par +221, vérifier la longueur
  if (cleaned.startsWith('+221') && cleaned.length === 13) {
    console.log('📱 [AUTH] formatPhoneNumber - Format +221 valide:', cleaned);
    return cleaned;
  }
  
  // Si commence par 0, remplacer par +221
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    const formatted = `+221${cleaned.substring(1)}`;
    console.log('📱 [AUTH] formatPhoneNumber - Format 0 valide:', formatted);
    return formatted;
  }
  
  // Si commence par 221 (sans +), ajouter le +
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    const formatted = `+${cleaned}`;
    console.log('📱 [AUTH] formatPhoneNumber - Format 221 valide:', formatted);
    return formatted;
  }
  
  // Si c'est juste les 9 chiffres du numéro sénégalais
  if (cleaned.length === 9 && /^[0-9]{9}$/.test(cleaned)) {
    const formatted = `+221${cleaned}`;
    console.log('📱 [AUTH] formatPhoneNumber - Format 9 chiffres valide:', formatted);
    return formatted;
  }
  
  console.log('📱 [AUTH] formatPhoneNumber - Format invalide:', cleaned);
  return null;
};

/**
 * Obtient le rôle de l'utilisateur depuis la session
 * @param user - Utilisateur Supabase
 * @returns Rôle de l'utilisateur ou null
 */
export const getUserRole = (user: User | null): UserRole | null => {
  if (!user) return null;
  return user.user_metadata?.role as UserRole || null;
};

/**
 * Récupère le rôle de l'utilisateur depuis la base de données
 * @param userId - ID de l'utilisateur
 * @returns Rôle de l'utilisateur ou null
 */
export const fetchUserRoleFromDatabase = async (userId: string): Promise<UserRole | null> => {
  try {
    console.log('🔍 [AUTH] fetchUserRoleFromDatabase - Récupération du rôle pour:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.log('❌ [AUTH] fetchUserRoleFromDatabase - Erreur:', error);
      return null;
    }
    
    const role = data?.role as UserRole;
    console.log('✅ [AUTH] fetchUserRoleFromDatabase - Rôle récupéré:', role);
    return role;
  } catch (error) {
    console.log('❌ [AUTH] fetchUserRoleFromDatabase - Exception:', error);
    return null;
  }
};

/**
 * Récupère approval_status depuis la table profiles
 */
export const fetchApprovalStatus = async (userId: string): Promise<'pending' | 'approved' | 'rejected' | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }
    return (data?.approval_status as any) || null;
  } catch {
    return null;
  }
};

/**
 * Crée un profil utilisateur avec un rôle spécifique
 * @param user - Utilisateur Supabase
 * @param role - Rôle à assigner (producteur ou agent)
 * @returns true si le profil a été créé, false sinon
 */
export const createUserProfile = async (user: User, role: UserRole, displayNameOverride?: string): Promise<boolean> => {
  try {
    console.log('👤 [AUTH] createUserProfile - Création du profil pour:', user.id, 'avec le rôle:', role);
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        role: role,
        display_name: displayNameOverride || user.user_metadata?.full_name || 'Utilisateur Mobile',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.log('❌ [AUTH] createUserProfile - Erreur:', error);
      return false;
    }
    
    console.log('✅ [AUTH] createUserProfile - Profil créé avec succès');
    return true;
  } catch (error) {
    console.log('❌ [AUTH] createUserProfile - Exception:', error);
    return false;
  }
};

/**
 * Vérifie si un profil existe pour l'utilisateur
 * @param userId - ID de l'utilisateur
 * @returns true si le profil existe, false sinon
 */
export const userProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      return false;
    }
    
    return !!data;
  } catch {
    return false;
  }
};

/**
 * Valide si l'utilisateur peut accéder à la plateforme mobile
 * L'application mobile AgriConnect est uniquement destinée aux producteurs et agents de terrain
 * Les superviseurs et administrateurs utilisent l'interface web
 * @param user - Utilisateur Supabase
 * @returns true si l'utilisateur peut accéder, false sinon
 */
export const canAccessMobile = (user: User | null): boolean => {
  const role = getUserRole(user);
  if (!role) return false;
  
  // Seuls les agents et producteurs peuvent accéder au mobile
  // Les superviseurs et admins utilisent l'interface web
  return ['agent', 'producer'].includes(role);
};

/**
 * Obtient les informations complètes de l'utilisateur avec validation
 * @param user - Utilisateur Supabase
 * @param session - Session Supabase
 * @returns Informations complètes de l'utilisateur
 */
export const getUserInfo = async (user: User | null, session: Session | null): Promise<{
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  canAccessMobile: boolean;
  phone: string | null;
  producerId: string | null; // Ajouter le producerId
}> => {
  if (!user || !session) {
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      userRole: null,
      canAccessMobile: false,
      phone: null,
      producerId: null, // Initialiser à null
    };
  }

  let userRole = getUserRole(user);
  const phone = user?.phone || null;
  
  // Si l'utilisateur n'a pas de rôle dans les métadonnées, vérifier le profil
  if (!userRole) {
    console.log('🔍 [AUTH] getUserInfo - Pas de rôle dans les métadonnées, vérification du profil...');
    
    // Vérifier si le profil existe
    const profileExists = await userProfileExists(user.id);
    
    if (!profileExists) {
      console.log('👤 [AUTH] getUserInfo - Profil inexistant, sélection de rôle requise...');
      // L'utilisateur doit sélectionner son rôle avant de continuer
      userRole = null;
    } else {
      // Récupérer le rôle depuis la base de données
      userRole = await fetchUserRoleFromDatabase(user.id);
      console.log('🔍 [AUTH] getUserInfo - Rôle récupéré depuis la base de données:', userRole);
    }
  }
  
  // NOUVEAU: Récupérer le producerId si l'utilisateur est un producteur
  let producerId: string | null = null;
  if (userRole === 'producer' && user.id) {
    try {
      const { data: producerData, error: producerError } = await supabase
        .from('producers')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      if (producerError) {
        console.warn(`[AUTH] Avertissement: Impossible de lier le profil producteur: ${producerError.message}`);
      } else if (producerData) {
        producerId = producerData.id;
        console.log(`✅ [AUTH] Profil producteur lié avec succès. Producer ID: ${producerId}`);
      }
    } catch (e) {
       console.error(`[AUTH] Erreur critique lors de la liaison du profil producteur:`, e);
    }
  }

  // Lire approval_status pour les agents
  let approval: 'pending' | 'approved' | 'rejected' | null = null;
  if (userRole === 'agent') {
    approval = await fetchApprovalStatus(user.id);
  }
  // Calculer canAccessMobile avec validation agent approuvé
  const canAccess = userRole
    ? userRole === 'agent'
      ? approval === 'approved'
      : userRole === 'producer'
    : false;
  
  console.log('👤 [AUTH] getUserInfo - Informations utilisateur finales:', {
    userId: user?.id,
    userRole,
    phone,
    canAccessMobile: canAccess
  });
  
  return {
    isAuthenticated: !!user && !!session,
    user,
    session,
    userRole,
    canAccessMobile: canAccess,
    phone,
    producerId, // Retourner le producerId
  };
};

// Export de la classe MobileAuthService pour compatibilité
export class MobileAuthService {
  static async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    const result = await sendOtpSms(phone);
    return {
      success: result.success || false,
      error: result.error?.message
    };
  }

  static async verifyOTP(phone: string, token: string): Promise<MobileAuthResponse> {
    const result = await verifyOtpSms(phone, token);
    const userRole = getUserRole(result.user || null);
    
    return {
      success: result.success || false,
      user: result.user,
      session: result.session,
      error: result.error?.message,
      userRole
    };
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

  static async clearAllTokens(): Promise<{ success: boolean; error?: string }> {
    return await clearAllTokens();
  }

  static getUserRole = getUserRole;
  static canAccessMobile = canAccessMobile;
  static getUserInfo = getUserInfo;
  static createUserProfile = createUserProfile;
  static userProfileExists = userProfileExists;
  static fetchUserRoleFromDatabase = fetchUserRoleFromDatabase;
  static fetchApprovalStatus = fetchApprovalStatus;
}