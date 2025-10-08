/**
 * Service d'authentification - AgriConnect
 * Gestion centralisée de l'authentification et des utilisateurs
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { AuthCache } from './auth.cache';
import {
  User,
  UserProfile,
  AuthSession,
  LoginCredentials,
  RegisterData,
  PasswordResetData,
  AuthServiceOptions,
  OTPResponse
} from './auth.types';

class AuthService {
  private supabase: SupabaseClient = supabase;
  private cache = new AuthCache();

  /**
   * Authentifie un utilisateur avec son téléphone et mot de passe
   */
  async signInWithPassword(
    credentials: LoginCredentials,
    options: AuthServiceOptions = {}
  ): Promise<AuthSession> {
    console.log('🔐 [AuthService] Tentative de connexion pour:', credentials.phone);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        phone: credentials.phone,
        password: credentials.password || ''
      });

      if (error) {
        console.error('❌ [AuthService] Erreur de connexion:', error);
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Données de session manquantes');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] Connexion réussie en ${responseTime}ms`);

      const session: AuthSession = {
        user: this.formatUserData(data.user),
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
        expires_in: data.session.expires_in || 3600
      };

      // Mettre en cache la session
      if (options.useCache !== false) {
        await this.cache.setSession(session, options.cacheTTL);
      }

      return session;
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Authentifie un utilisateur avec OTP
   */
  async signInWithOTP(
    phone: string,
    otp: string,
    options: AuthServiceOptions = {}
  ): Promise<AuthSession> {
    console.log('📱 [AuthService] Tentative de connexion OTP pour:', phone);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        console.error('❌ [AuthService] Erreur OTP:', error);
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Données de session manquantes');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] Connexion OTP réussie en ${responseTime}ms`);

      const session: AuthSession = {
        user: this.formatUserData(data.user),
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
        expires_in: data.session.expires_in || 3600
      };

      // Mettre en cache la session
      if (options.useCache !== false) {
        await this.cache.setSession(session, options.cacheTTL);
      }

      return session;
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la connexion OTP:', error);
      throw error;
    }
  }

  /**
   * Envoie un OTP à un numéro de téléphone
   */
  async sendOTP(phone: string): Promise<OTPResponse> {
    console.log('📤 [AuthService] Envoi d\'OTP à:', phone);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase.auth.signInWithOtp({
        phone
      });

      if (error) {
        console.error('❌ [AuthService] Erreur envoi OTP:', error);
        return {
          success: false,
          message: error.message
        };
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] OTP envoyé en ${responseTime}ms`);

      return {
        success: true,
        message: 'OTP envoyé avec succès',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de l\'envoi OTP:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   */
  async signUp(
    registerData: RegisterData,
    options: AuthServiceOptions = {}
  ): Promise<AuthSession> {
    console.log('📝 [AuthService] Inscription d\'un nouvel utilisateur:', registerData.phone);

    try {
      const startTime = Date.now();
      
      // 1. Créer le compte auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        phone: registerData.phone,
        password: registerData.password || ''
      });

      if (authError) {
        console.error('❌ [AuthService] Erreur inscription auth:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Utilisateur non créé');
      }

      // 2. Créer le profil utilisateur
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          phone: registerData.phone,
          role: registerData.role,
          full_name: registerData.full_name,
          region: registerData.region,
          department: registerData.department,
          commune: registerData.commune,
          cooperative_id: registerData.cooperative_id
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ [AuthService] Erreur création profil:', profileError);
        // Nettoyer le compte auth en cas d'erreur
        // @ts-ignore
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Erreur lors de la création du profil');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] Inscription réussie en ${responseTime}ms`);

      const session: AuthSession = {
        user: this.formatUserData(authData.user),
        access_token: authData.session?.access_token || '',
        refresh_token: authData.session?.refresh_token || '',
        expires_at: authData.session?.expires_at || 0,
        expires_in: authData.session?.expires_in || 3600
      };

      // Mettre en cache la session
      if (options.useCache !== false) {
        await this.cache.setSession(session, options.cacheTTL);
      }

      return session;
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async signOut(): Promise<void> {
    console.log('🚪 [AuthService] Déconnexion de l\'utilisateur');

    try {
      const startTime = Date.now();
      
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('❌ [AuthService] Erreur de déconnexion:', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] Déconnexion réussie en ${responseTime}ms`);

      // Nettoyer le cache
      await this.cache.invalidateSession();
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  /**
   * Récupère la session actuelle
   */
  async getCurrentSession(
    options: AuthServiceOptions = {}
  ): Promise<AuthSession | null> {
    const { useCache = true, refreshCache = false } = options;

    // Vérifier le cache d'abord
    if (useCache && !refreshCache) {
      const cachedSession = await this.cache.getSession();
      if (cachedSession) {
        console.log('⚡ [AuthService] Session récupérée depuis le cache');
        return cachedSession;
      }
    }

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('❌ [AuthService] Erreur récupération session:', error);
        return null;
      }

      if (!session) {
        console.log('❌ [AuthService] Aucune session active');
        return null;
      }

      const authSession: AuthSession = {
        user: this.formatUserData(session.user),
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0,
        expires_in: session.expires_in || 3600
      };

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setSession(authSession);
      }

      return authSession;
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  /**
   * Récupère l'utilisateur actuel
   */
  async getCurrentUser(
    options: AuthServiceOptions = {}
  ): Promise<User | null> {
    const session = await this.getCurrentSession(options);
    return session?.user || null;
  }

  /**
   * Récupère le profil utilisateur actuel
   */
  async getCurrentUserProfile(
    options: AuthServiceOptions = {}
  ): Promise<UserProfile | null> {
    const user = await this.getCurrentUser(options);
    if (!user) return null;

    const { useCache = true, cacheTTL, refreshCache = false } = options;

    // Vérifier le cache
    if (useCache && !refreshCache) {
      const cachedProfile = await this.cache.getUserProfile(user.id);
      if (cachedProfile) {
        console.log(`⚡ [AuthService] Profil récupéré depuis le cache pour ${user.id}`);
        return cachedProfile;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ [AuthService] Erreur récupération profil:', error);
        return null;
      }

      const profile = this.formatUserProfileData(data);

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setUserProfile(user.id, profile, cacheTTL);
      }

      return profile;
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  /**
   * Réinitialise le mot de passe
   */
  async resetPassword(
    resetData: PasswordResetData
  ): Promise<{ success: boolean; message?: string }> {
    console.log('🔄 [AuthService] Réinitialisation du mot de passe pour:', resetData.phone);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase.auth.updateUser({
        password: resetData.new_password
      });

      if (error) {
        console.error('❌ [AuthService] Erreur réinitialisation:', error);
        return {
          success: false,
          message: error.message
        };
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [AuthService] Mot de passe réinitialisé en ${responseTime}ms`);

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };
    } catch (error) {
      console.error('❌ [AuthService] Erreur lors de la réinitialisation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Formate les données d'un utilisateur
   */
  private formatUserData(data: any): User {
    return {
      id: data.id,
      email: data.email,
      phone: data.phone,
      role: data.role || 'producteur',
      full_name: data.full_name,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_sign_in_at: data.last_sign_in_at,
      email_confirmed_at: data.email_confirmed_at,
      phone_confirmed_at: data.phone_confirmed_at,
      is_active: data.is_active !== false
    };
  }

  /**
   * Formate les données d'un profil utilisateur
   */
  private formatUserProfileData(data: any): UserProfile {
    return {
      id: data.id,
      user_id: data.id,
      phone: data.phone,
      role: data.role,
      full_name: data.full_name,
      display_name: data.display_name,
      region: data.region,
      department: data.department,
      commune: data.commune,
      cooperative_id: data.cooperative_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_active: data.is_active !== false
    };
  }

  /**
   * Invalide le cache d'authentification
   */
  async invalidateCache(): Promise<void> {
    console.log('🗑️ [AuthService] Invalidation du cache d\'authentification');
    await this.cache.invalidateAllCache();
  }
}

export const AuthServiceInstance = new AuthService();
