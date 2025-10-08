/**
 * Hook pour la gestion de l'authentification avec cache
 */

import { useCallback, useEffect, useState } from 'react';
import { AuthService } from '../services/domain/auth';
import { AuthCache } from '../services/domain/auth';
import {
  User,
  UserProfile,
  AuthSession,
  LoginCredentials,
  RegisterData,
  PasswordResetData,
  OTPResponse,
  AuthServiceOptions
} from '../services/domain/auth';

export interface UseAuthOptions extends AuthServiceOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: AuthSession | UserProfile) => void;
}

export interface UseAuthReturn {
  user: User | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthSession | null>;
  signInWithOTP: (phone: string, otp: string) => Promise<AuthSession | null>;
  signUp: (data: RegisterData) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
  sendOTP: (phone: string) => Promise<OTPResponse>;
  resetPassword: (data: PasswordResetData) => Promise<{ success: boolean; message?: string }>;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook principal pour l'authentification
 */
export const useAuth = (options: UseAuthOptions = {}): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isAuthenticated = !!user && !!session;

  // Vérifier la session au montage
  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentSession = await AuthService.getCurrentSession(options);
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Récupérer le profil utilisateur
        const userProfile = await AuthService.getCurrentUserProfile(options);
        setProfile(userProfile);
        options.onSuccess?.(currentSession);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la vérification de la session');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<AuthSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const authSession = await AuthService.signInWithPassword(credentials, options);
      setSession(authSession);
      setUser(authSession.user);

      // Récupérer le profil utilisateur
      const userProfile = await AuthService.getCurrentUserProfile(options);
      setProfile(userProfile);

      options.onSuccess?.(authSession);
      return authSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la connexion');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const signInWithOTP = useCallback(async (phone: string, otp: string): Promise<AuthSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const authSession = await AuthService.signInWithOTP(phone, otp, options);
      setSession(authSession);
      setUser(authSession.user);

      // Récupérer le profil utilisateur
      const userProfile = await AuthService.getCurrentUserProfile(options);
      setProfile(userProfile);

      options.onSuccess?.(authSession);
      return authSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la connexion OTP');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const signUp = useCallback(async (registerData: RegisterData): Promise<AuthSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const authSession = await AuthService.signUp(registerData, options);
      setSession(authSession);
      setUser(authSession.user);

      // Récupérer le profil utilisateur
      const userProfile = await AuthService.getCurrentUserProfile(options);
      setProfile(userProfile);

      options.onSuccess?.(authSession);
      return authSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de l\'inscription');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await AuthService.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la déconnexion');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const sendOTP = useCallback(async (phone: string): Promise<OTPResponse> => {
    setError(null);

    try {
      const response = await AuthService.sendOTP(phone);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de l\'envoi de l\'OTP');
      setError(error);
      options.onError?.(error);
      return {
        success: false,
        message: error.message
      };
    }
  }, [options]);

  const resetPassword = useCallback(async (resetData: PasswordResetData): Promise<{ success: boolean; message?: string }> => {
    setError(null);

    try {
      const response = await AuthService.resetPassword(resetData);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la réinitialisation du mot de passe');
      setError(error);
      options.onError?.(error);
      return {
        success: false,
        message: error.message
      };
    }
  }, [options]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userProfile = await AuthService.getCurrentUserProfile({ ...options, refreshCache: true });
      setProfile(userProfile);
      if (userProfile) {
        options.onSuccess?.(userProfile);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour du profil');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [user, options]);

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    signIn,
    signInWithOTP,
    signUp,
    signOut,
    sendOTP,
    resetPassword,
    refreshProfile
  };
};

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export const useIsAuthenticated = (): boolean => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setIsAuthenticated(!!currentUser);
    };

    checkAuth();
  }, []);

  return isAuthenticated;
};

/**
 * Hook pour récupérer l'utilisateur actuel
 */
export const useCurrentUser = (
  options: UseAuthOptions = {}
): {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = await AuthService.getCurrentUser(options);
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await AuthService.getCurrentUserProfile(options);
        setProfile(userProfile);
        if (userProfile) {
          options.onSuccess?.(userProfile);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la récupération de l\'utilisateur');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    user,
    profile,
    loading,
    error,
    refetch: fetchCurrentUser
  };
};

/**
 * Hook pour invalider le cache d'authentification
 */
export const useInvalidateAuthCache = () => {
  const invalidateCache = useCallback(async () => {
    await AuthCache.invalidateAllCache();
  }, []);

  return {
    invalidateCache
  };
};
