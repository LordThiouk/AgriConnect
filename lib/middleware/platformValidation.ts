/**
 * Platform Validation Middleware - AgriConnect
 * Middleware de validation des plateformes et rôles
 * Assure la séparation stricte entre mobile et web selon les rôles utilisateur
 */

import { validatePlatformRole, defaultAuthConfig } from '../auth/config';

export type Platform = 'mobile' | 'web';
export type UserRole = 'agent' | 'producer' | 'admin' | 'supervisor';

export interface PlatformAccessResult {
  allowed: boolean;
  platform: Platform;
  role: UserRole;
  error?: string;
}

export interface ValidationContext {
  userRole: UserRole;
  platform: Platform;
  authMethod: 'otp_sms' | 'email_password';
  userId: string;
  timestamp: Date;
}

/**
 * Validation de l'accès à une plateforme selon le rôle utilisateur
 */
export const validatePlatformAccess = (
  userRole: UserRole, 
  platform: Platform
): PlatformAccessResult => {
  const allowedRoles = defaultAuthConfig.platformRoles[platform];
  
  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      platform,
      role: userRole,
      error: `Accès ${platform} non autorisé pour le rôle ${userRole}`
    };
  }

  return {
    allowed: true,
    platform,
    role: userRole
  };
};

/**
 * Validation complète de l'accès plateforme + rôle + méthode d'authentification
 */
export const validateCompleteAccess = (
  context: ValidationContext
): PlatformAccessResult => {
  // 1. Validation plateforme + rôle
  const platformValidation = validatePlatformAccess(context.userRole, context.platform);
  
  if (!platformValidation.allowed) {
    return platformValidation;
  }

  // 2. Validation méthode d'authentification + plateforme
  const authMethodValidation = validateAuthMethodForPlatform(
    context.authMethod, 
    context.platform
  );

  if (!authMethodValidation.allowed) {
    return {
      allowed: false,
      platform: context.platform,
      role: context.userRole,
      error: authMethodValidation.error
    };
  }

  // 3. Validation des permissions spécifiques au rôle
  const rolePermissions = getRolePermissions(context.userRole, context.platform);
  
  if (rolePermissions.length === 0) {
    return {
      allowed: false,
      platform: context.platform,
      role: context.userRole,
      error: `Aucune permission trouvée pour le rôle ${context.userRole} sur ${context.platform}`
    };
  }

  return {
    allowed: true,
    platform: context.platform,
    role: context.userRole
  };
};

/**
 * Validation de la méthode d'authentification selon la plateforme
 */
export const validateAuthMethodForPlatform = (
  authMethod: 'otp_sms' | 'email_password',
  platform: Platform
): { allowed: boolean; error?: string } => {
  const validMethods = {
    mobile: ['otp_sms'],
    web: ['email_password']
  };

  if (!validMethods[platform].includes(authMethod)) {
    return {
      allowed: false,
      error: `Méthode d'authentification ${authMethod} non autorisée sur la plateforme ${platform}`
    };
  }

  return { allowed: true };
};

/**
 * Obtention des permissions selon le rôle et la plateforme
 */
export const getRolePermissions = (role: UserRole, platform: Platform): string[] => {
  const permissions = {
    agent: {
      mobile: [
        'read_assigned_producers',
        'create_plots',
        'update_observations',
        'read_cooperative_data',
        'upload_photos'
      ],
      web: [] // Agents n'ont pas accès web
    },
    producer: {
      mobile: [
        'read_own_plots',
        'update_own_observations',
        'read_own_recommendations',
        'upload_own_photos'
      ],
      web: [] // Producteurs n'ont pas accès web
    },
    supervisor: {
      mobile: [], // Superviseurs n'ont pas accès mobile
      web: [
        'read_cooperative_data',
        'validate_agent_data',
        'read_reports',
        'manage_cooperative_users',
        'send_recommendations'
      ]
    },
    admin: {
      mobile: [], // Admins n'ont pas accès mobile
      web: [
        'read_all_data',
        'manage_users',
        'system_config',
        'read_global_reports',
        'manage_cooperatives',
        'system_monitoring'
      ]
    }
  };

  return permissions[role]?.[platform] || [];
};

/**
 * Validation des permissions pour une action spécifique
 */
export const validatePermission = (
  userRole: UserRole,
  platform: Platform,
  permission: string
): boolean => {
  const userPermissions = getRolePermissions(userRole, platform);
  return userPermissions.includes(permission);
};

/**
 * Middleware de validation pour les requêtes API
 */
export const createPlatformValidationMiddleware = (platform: Platform) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Extraire les informations utilisateur du token JWT
      const userRole = req.user?.user_metadata?.role;
      const authMethod = req.user?.user_metadata?.auth_method;

      if (!userRole || !authMethod) {
        return res.status(401).json({
          error: 'Informations utilisateur manquantes dans le token'
        });
      }

      // Validation complète de l'accès
      const validationResult = validateCompleteAccess({
        userRole,
        platform,
        authMethod,
        userId: req.user.id,
        timestamp: new Date()
      });

      if (!validationResult.allowed) {
        return res.status(403).json({
          error: validationResult.error,
          platform: validationResult.platform,
          role: validationResult.role
        });
      }

      // Ajouter les informations de validation au contexte de la requête
      req.platformValidation = validationResult;
      req.userPermissions = getRolePermissions(userRole, platform);

      next();
    } catch (error) {
      console.error('Erreur dans le middleware de validation plateforme:', error);
      return res.status(500).json({
        error: 'Erreur interne lors de la validation de la plateforme'
      });
    }
  };
};

/**
 * Middleware de validation des permissions pour des actions spécifiques
 */
export const createPermissionMiddleware = (requiredPermission: string) => {
  return (req: any, res: any, next: any) => {
    try {
      const { userRole, platform } = req.platformValidation;
      
      if (!userRole || !platform) {
        return res.status(400).json({
          error: 'Validation de plateforme non effectuée'
        });
      }

      if (!validatePermission(userRole, platform, requiredPermission)) {
        return res.status(403).json({
          error: `Permission ${requiredPermission} requise pour cette action`,
          userRole,
          platform
        });
      }

      next();
    } catch (error) {
      console.error('Erreur dans le middleware de validation des permissions:', error);
      return res.status(500).json({
        error: 'Erreur interne lors de la validation des permissions'
      });
    }
  };
};

/**
 * Utilitaire de logging des tentatives d'accès
 */
export const logAccessAttempt = (context: ValidationContext, success: boolean): void => {
  const logEntry = {
    timestamp: context.timestamp.toISOString(),
    userId: context.userId,
    userRole: context.userRole,
    platform: context.platform,
    authMethod: context.authMethod,
    success,
    ipAddress: 'N/A', // À récupérer du contexte de la requête
    userAgent: 'N/A'  // À récupérer du contexte de la requête
  };

  console.log('Access Attempt Log:', logEntry);
  
  // Ici, on pourrait envoyer les logs vers une base de données
  // ou un service de logging externe
};

export default {
  validatePlatformAccess,
  validateCompleteAccess,
  validateAuthMethodForPlatform,
  getRolePermissions,
  validatePermission,
  createPlatformValidationMiddleware,
  createPermissionMiddleware,
  logAccessAttempt
};
