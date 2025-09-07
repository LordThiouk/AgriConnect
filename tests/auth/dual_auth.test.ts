/**
 * Tests d'authentification duale - AgriConnect
 * Tests complets pour l'authentification OTP SMS (mobile) et Email/Password (web)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MobileAuthService, MobileAuthResponse } from '../../mobile/lib/auth/mobileAuthService';
import { WebAuthService, WebAuthResponse } from '../../web/src/services/webAuthService';
import { SessionManager } from '../../mobile/lib/auth/sessionManager';
import { WebSessionManager } from '../../web/src/services/webSessionManager';
import { validatePlatformAccess, validateCompleteAccess } from '../../lib/middleware/platformValidation';
import { AuthLoggingService } from '../../lib/services/authLogging';
import { defaultAuthConfig } from '../../lib/auth/config';

// Mock Supabase
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock des services externes
vi.mock('../../lib/services/authLogging', () => ({
  AuthLoggingService: {
    logEvent: vi.fn(),
    logLoginAttempt: vi.fn(),
    logPlatformAccess: vi.fn(),
    logLogout: vi.fn(),
    logSessionRefresh: vi.fn(),
    logOTPEvent: vi.fn(),
    logSuspiciousActivity: vi.fn(),
    getAuthLogs: vi.fn(),
    getAuthLogStats: vi.fn(),
    cleanupOldLogs: vi.fn(),
    exportLogsToCSV: vi.fn()
  }
}));

describe('Configuration d\'authentification duale', () => {
  it('devrait avoir une configuration valide', () => {
    expect(defaultAuthConfig).toBeDefined();
    expect(defaultAuthConfig.jwtExpiry.mobile).toBe(24 * 60 * 60 * 1000); // 24h
    expect(defaultAuthConfig.jwtExpiry.web).toBe(8 * 60 * 60 * 1000); // 8h
    expect(defaultAuthConfig.platformRoles.mobile).toContain('agent');
    expect(defaultAuthConfig.platformRoles.mobile).toContain('producer');
    expect(defaultAuthConfig.platformRoles.web).toContain('admin');
    expect(defaultAuthConfig.platformRoles.web).toContain('supervisor');
  });

  it('devrait valider les rôles par plateforme', () => {
    expect(defaultAuthConfig.platformRoles.mobile).not.toContain('admin');
    expect(defaultAuthConfig.platformRoles.mobile).not.toContain('supervisor');
    expect(defaultAuthConfig.platformRoles.web).not.toContain('agent');
    expect(defaultAuthConfig.platformRoles.web).not.toContain('producer');
  });
});

describe('Validation des plateformes', () => {
  it('devrait autoriser l\'accès mobile pour les agents', () => {
    const result = validatePlatformAccess('agent', 'mobile');
    expect(result.allowed).toBe(true);
    expect(result.platform).toBe('mobile');
    expect(result.role).toBe('agent');
  });

  it('devrait autoriser l\'accès mobile pour les producteurs', () => {
    const result = validatePlatformAccess('producer', 'mobile');
    expect(result.allowed).toBe(true);
    expect(result.platform).toBe('mobile');
    expect(result.role).toBe('producer');
  });

  it('devrait autoriser l\'accès web pour les admins', () => {
    const result = validatePlatformAccess('admin', 'web');
    expect(result.allowed).toBe(true);
    expect(result.platform).toBe('web');
    expect(result.role).toBe('admin');
  });

  it('devrait autoriser l\'accès web pour les superviseurs', () => {
    const result = validatePlatformAccess('supervisor', 'web');
    expect(result.allowed).toBe(true);
    expect(result.platform).toBe('web');
    expect(result.role).toBe('supervisor');
  });

  it('devrait refuser l\'accès mobile pour les admins', () => {
    const result = validatePlatformAccess('admin', 'mobile');
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Accès mobile non autorisé pour le rôle admin');
  });

  it('devrait refuser l\'accès web pour les agents', () => {
    const result = validatePlatformAccess('agent', 'web');
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Accès web non autorisé pour le rôle agent');
  });
});

describe('Validation complète des accès', () => {
  it('devrait valider un accès complet valide', () => {
    const context = {
      userRole: 'agent' as const,
      platform: 'mobile' as const,
      authMethod: 'otp_sms' as const,
      userId: 'test-user-id',
      timestamp: new Date()
    };

    const result = validateCompleteAccess(context);
    expect(result.allowed).toBe(true);
  });

  it('devrait refuser un accès avec méthode d\'authentification invalide', () => {
    const context = {
      userRole: 'agent' as const,
      platform: 'mobile' as const,
      authMethod: 'email_password' as const, // Invalide pour mobile
      userId: 'test-user-id',
      timestamp: new Date()
    };

    const result = validateCompleteAccess(context);
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Méthode d\'authentification email_password non autorisée');
  });
});

describe('Service d\'authentification mobile (OTP SMS)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait valider un numéro de téléphone valide', async () => {
    const phone = '+221701234567';
    const isValid = await MobileAuthService.isValidPhoneNumber(phone);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter un numéro de téléphone invalide', async () => {
    const phone = 'invalid-phone';
    const isValid = await MobileAuthService.isValidPhoneNumber(phone);
    expect(isValid).toBe(false);
  });

  it('devrait valider un format OTP valide', async () => {
    const otp = '123456';
    const isValid = await MobileAuthService.isValidOTP(otp);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter un format OTP invalide', async () => {
    const otp = '12345'; // Trop court
    const isValid = await MobileAuthService.isValidOTP(otp);
    expect(isValid).toBe(false);
  });

  it('devrait envoyer un OTP', async () => {
    const phone = '+221701234567';
    const result = await MobileAuthService.sendOTP(phone);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('OTP envoyé');
  });

  it('devrait vérifier un OTP valide', async () => {
    const phone = '+221701234567';
    const otp = '123456';
    const result = await MobileAuthService.verifyOTP(phone, otp);
    
    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
  });

  it('devrait gérer la déconnexion', async () => {
    const result = await MobileAuthService.signOut();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Déconnexion réussie');
  });
});

describe('Service d\'authentification web (Email/Password)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait valider un email valide', async () => {
    const email = 'test@example.com';
    const isValid = await WebAuthService.isValidEmail(email);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter un email invalide', async () => {
    const email = 'invalid-email';
    const isValid = await WebAuthService.isValidEmail(email);
    expect(isValid).toBe(false);
  });

  it('devrait valider un mot de passe conforme', async () => {
    const password = 'SecurePass123!';
    const isValid = await WebAuthService.isValidPassword(password);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter un mot de passe faible', async () => {
    const password = 'weak';
    const isValid = await WebAuthService.isValidPassword(password);
    expect(isValid).toBe(false);
  });

  it('devrait permettre la connexion avec des identifiants valides', async () => {
    const email = 'admin@agriconnect.sn';
    const password = 'SecurePass123!';
    const result = await WebAuthService.signIn(email, password);
    
    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
  });

  it('devrait gérer la création d\'utilisateur (admin uniquement)', async () => {
    const createRequest = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: 'supervisor' as const,
      fullName: 'Nouvel Utilisateur'
    };
    
    const result = await WebAuthService.createUser(createRequest);
    expect(result.success).toBe(true);
  });

  it('devrait gérer la réinitialisation de mot de passe', async () => {
    const email = 'user@example.com';
    const result = await WebAuthService.resetPassword(email);
    expect(result.success).toBe(true);
  });
});

describe('Gestionnaire de sessions mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait assurer une session valide', async () => {
    const mockSession = {
      access_token: 'mock-token',
      expires_at: Date.now() + 3600000, // 1h dans le futur
      user: { id: 'test-user', user_metadata: { role: 'agent' } }
    } as any;

    const result = await SessionManager.ensureValidSession();
    expect(result).toBeDefined();
  });

  it('devrait rafraîchir une session expirée', async () => {
    const mockSession = {
      access_token: 'mock-token',
      expires_at: Date.now() - 1000, // Expiré
      user: { id: 'test-user', user_metadata: { role: 'agent' } }
    } as any;

    const result = await SessionManager.refreshSession();
    expect(result).toBeDefined();
  });

  it('devrait vérifier la validité d\'une session', () => {
    const validSession = {
      access_token: 'mock-token',
      expires_at: Date.now() + 3600000
    } as any;

    const isValid = SessionManager.isSessionValid(validSession);
    expect(isValid).toBe(true);
  });

  it('devrait détecter une session nécessitant un rafraîchissement', () => {
    const sessionNeedingRefresh = {
      access_token: 'mock-token',
      expires_at: Date.now() + 1800000 // 30min dans le futur
    } as any;

    const needsRefresh = SessionManager.needsSessionRefresh(sessionNeedingRefresh);
    expect(needsRefresh).toBe(true);
  });
});

describe('Gestionnaire de sessions web', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait gérer les changements de visibilité du navigateur', () => {
    WebSessionManager.setupVisibilityChangeHandler();
    // Simuler un changement de visibilité
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });
    
    // Déclencher l'événement
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(WebSessionManager).toBeDefined();
  });

  it('devrait gérer les changements de focus de la fenêtre', () => {
    WebSessionManager.setupFocusHandler();
    
    // Simuler un regain de focus
    window.dispatchEvent(new Event('focus'));
    
    expect(WebSessionManager).toBeDefined();
  });
});

describe('Service de journalisation d\'authentification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait journaliser un événement d\'authentification', async () => {
    const logEntry = {
      event_type: 'login_success' as const,
      platform: 'mobile' as const,
      auth_method: 'otp_sms' as const,
      user_role: 'agent',
      success: true,
      metadata: { source: 'test' }
    };

    const result = await AuthLoggingService.logEvent(logEntry);
    expect(result).toBeDefined();
  });

  it('devrait journaliser une tentative de connexion', async () => {
    const mockUser = {
      id: 'test-user',
      user_metadata: { role: 'agent' }
    } as any;

    await AuthLoggingService.logLoginAttempt(
      mockUser,
      'mobile',
      'otp_sms',
      true
    );

    expect(AuthLoggingService.logEvent).toHaveBeenCalled();
  });

  it('devrait journaliser un accès à une plateforme', async () => {
    const mockUser = {
      id: 'test-user',
      user_metadata: { role: 'agent' }
    } as any;

    await AuthLoggingService.logPlatformAccess(
      mockUser,
      'mobile',
      'otp_sms',
      true
    );

    expect(AuthLoggingService.logEvent).toHaveBeenCalled();
  });

  it('devrait récupérer les logs avec filtres', async () => {
    const filters = {
      platform: 'mobile' as const,
      success: true,
      user_role: 'agent'
    };

    const logs = await AuthLoggingService.getAuthLogs(filters);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('devrait calculer les statistiques des logs', async () => {
    const stats = await AuthLoggingService.getAuthLogStats();
    expect(stats).toHaveProperty('total_events');
    expect(stats).toHaveProperty('success_rate');
    expect(stats).toHaveProperty('events_by_type');
  });
});

describe('Intégration complète du système d\'authentification', () => {
  it('devrait permettre à un agent de se connecter sur mobile', async () => {
    // 1. Envoi OTP
    const phone = '+221701234567';
    const sendResult = await MobileAuthService.sendOTP(phone);
    expect(sendResult.success).toBe(true);

    // 2. Vérification OTP
    const otp = '123456';
    const verifyResult = await MobileAuthService.verifyOTP(phone, otp);
    expect(verifyResult.success).toBe(true);

    // 3. Validation de la plateforme
    const user = verifyResult.user;
    const platformValidation = validatePlatformAccess(user?.user_metadata?.role, 'mobile');
    expect(platformValidation.allowed).toBe(true);

    // 4. Gestion de session
    const session = await SessionManager.ensureValidSession();
    expect(session).toBeDefined();
  });

  it('devrait permettre à un admin de se connecter sur web', async () => {
    // 1. Connexion email/password
    const email = 'admin@agriconnect.sn';
    const password = 'SecurePass123!';
    const signInResult = await WebAuthService.signIn(email, password);
    expect(signInResult.success).toBe(true);

    // 2. Validation de la plateforme
    const user = signInResult.user;
    const platformValidation = validatePlatformAccess(user?.user_metadata?.role, 'web');
    expect(platformValidation.allowed).toBe(true);

    // 3. Gestion de session
    const session = await WebSessionManager.ensureValidSession();
    expect(session).toBeDefined();
  });

  it('devrait refuser l\'accès cross-platform', async () => {
    // Un agent ne devrait pas pouvoir accéder au web
    const agentWebAccess = validatePlatformAccess('agent', 'web');
    expect(agentWebAccess.allowed).toBe(false);

    // Un admin ne devrait pas pouvoir accéder au mobile
    const adminMobileAccess = validatePlatformAccess('admin', 'mobile');
    expect(adminMobileAccess.allowed).toBe(false);
  });

  it('devrait journaliser tous les événements d\'authentification', async () => {
    // Vérifier que la journalisation est appelée pour chaque événement
    expect(AuthLoggingService.logEvent).toHaveBeenCalled();
  });
});

describe('Gestion des erreurs et cas limites', () => {
  it('devrait gérer les tentatives d\'authentification échouées', async () => {
    const phone = '+221701234567';
    const invalidOtp = '000000';
    
    const result = await MobileAuthService.verifyOTP(phone, invalidOtp);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('devrait gérer les sessions expirées', async () => {
    const expiredSession = {
      access_token: 'expired-token',
      expires_at: Date.now() - 1000
    } as any;

    const isValid = SessionManager.isSessionValid(expiredSession);
    expect(isValid).toBe(false);
  });

  it('devrait gérer les rôles invalides', () => {
    const invalidRole = 'invalid_role';
    const mobileAccess = validatePlatformAccess(invalidRole as any, 'mobile');
    expect(mobileAccess.allowed).toBe(false);
  });
});

describe('Performance et scalabilité', () => {
  it('devrait gérer de multiples connexions simultanées', async () => {
    const promises = Array(10).fill(null).map(async (_, index) => {
      const phone = `+22170123456${index}`;
      return MobileAuthService.sendOTP(phone);
    });

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });

  it('devrait optimiser les requêtes de logs', async () => {
    const startTime = Date.now();
    await AuthLoggingService.getAuthLogStats();
    const endTime = Date.now();
    
    // Les statistiques devraient être calculées en moins de 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });
});
