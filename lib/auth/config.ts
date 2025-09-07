/**
 * Authentication Configuration - AgriConnect
 * Configuration centralisée pour l'authentification duale
 * OTP SMS (Mobile) + Email/Password (Web)
 */

export interface AuthConfig {
  // Configuration générale
  jwtExpiry: {
    mobile: number; // 24h en secondes
    web: number;    // 8h en secondes
  };
  
  // Configuration OTP SMS (Mobile)
  otp: {
    expiry: number;        // Expiration en secondes
    rateLimit: number;     // Tentatives par heure
    shouldCreateUser: boolean;
    template: string;
  };
  
  // Configuration Email/Password (Web)
  email: {
    enableSignup: boolean;
    doubleConfirmChanges: boolean;
    confirmEmailChange: boolean;
  };
  
  // Configuration des rôles par plateforme
  platformRoles: {
    mobile: string[];
    web: string[];
  };
}

/**
 * Configuration par défaut pour l'authentification duale
 */
export const defaultAuthConfig: AuthConfig = {
  jwtExpiry: {
    mobile: 24 * 60 * 60, // 24 heures
    web: 8 * 60 * 60,     // 8 heures
  },
  
  otp: {
    expiry: 600,           // 10 minutes
    rateLimit: 3,          // 3 tentatives par heure
    shouldCreateUser: false, // Utilisateur doit exister
    template: "Votre code AgriConnect: {{ .Code }}",
  },
  
  email: {
    enableSignup: false,   // Création manuelle par admin
    doubleConfirmChanges: true,
    confirmEmailChange: true,
  },
  
  platformRoles: {
    mobile: ['agent', 'producer'],
    web: ['admin', 'supervisor'],
  },
};

/**
 * Validation des rôles par plateforme
 */
export const validatePlatformRole = (role: string, platform: 'mobile' | 'web'): boolean => {
  const allowedRoles = defaultAuthConfig.platformRoles[platform];
  return allowedRoles.includes(role);
};

/**
 * Obtention de la configuration d'expiration JWT selon la plateforme
 */
export const getJWTExpiry = (platform: 'mobile' | 'web'): number => {
  return defaultAuthConfig.jwtExpiry[platform];
};

/**
 * Configuration des templates d'email
 */
export const emailTemplates = {
  confirmation: 'email_confirmation.html',
  recovery: 'password_recovery.html',
  welcome: 'welcome_email.html',
};

/**
 * Configuration des templates SMS
 */
export const smsTemplates = {
  otp: defaultAuthConfig.otp.template,
  welcome: 'Bienvenue sur AgriConnect ! Votre compte a été créé avec succès.',
  alert: 'Alerte AgriConnect: {{ .Message }}',
};

/**
 * Configuration des paramètres de sécurité
 */
export const securityConfig = {
  // Rate limiting
  rateLimits: {
    otp: {
      windowMs: 60 * 60 * 1000, // 1 heure
      max: defaultAuthConfig.otp.rateLimit,
    },
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 tentatives
    },
  },
  
  // Validation des mots de passe
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Session management
  session: {
    refreshThreshold: {
      mobile: 60 * 60 * 1000, // 1 heure
      web: 30 * 60 * 1000,    // 30 minutes
    },
  },
};

export default defaultAuthConfig;
