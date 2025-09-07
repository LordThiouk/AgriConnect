/**
 * User Types for AgriConnect
 * Defines user roles, permissions, and related types
 */

// User roles enum
export type UserRole = 'admin' | 'supervisor' | 'agent' | 'producer' | 'coop_admin';

// Platform types
export type Platform = 'web' | 'mobile';

// Role permissions interface
export interface RolePermissions {
  can_manage_users: boolean;
  can_manage_cooperatives: boolean;
  can_manage_producers: boolean;
  can_manage_plots: boolean;
  can_manage_crops: boolean;
  can_manage_operations: boolean;
  can_manage_observations: boolean;
  can_manage_recommendations: boolean;
  can_view_analytics: boolean;
  can_manage_system: boolean;
}

// Role display information
export interface RoleDisplayInfo {
  role: UserRole;
  displayName: string;
  description: string;
  platform: Platform;
  color: string;
  icon: string;
}

// Role configuration
export const ROLE_CONFIG: Record<UserRole, RoleDisplayInfo> = {
  admin: {
    role: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet au système',
    platform: 'web',
    color: 'red',
    icon: 'shield'
  },
  supervisor: {
    role: 'supervisor',
    displayName: 'Superviseur',
    description: 'Supervision régionale et analytique',
    platform: 'web',
    color: 'blue',
    icon: 'eye'
  },
  agent: {
    role: 'agent',
    displayName: 'Agent de terrain',
    description: 'Collecte de données sur le terrain',
    platform: 'mobile',
    color: 'green',
    icon: 'map-pin'
  },
  producer: {
    role: 'producer',
    displayName: 'Producteur',
    description: 'Suivi de ses parcelles et cultures',
    platform: 'mobile',
    color: 'yellow',
    icon: 'leaf'
  },
  coop_admin: {
    role: 'coop_admin',
    displayName: 'Administrateur de coopérative',
    description: 'Gestion de la coopérative',
    platform: 'web',
    color: 'purple',
    icon: 'building'
  }
};

// Platform-specific roles
export const WEB_ROLES: UserRole[] = ['admin', 'supervisor', 'coop_admin'];
export const MOBILE_ROLES: UserRole[] = ['agent', 'producer'];

// Role validation functions
export const isValidUserRole = (role: string): role is UserRole => {
  return ['admin', 'supervisor', 'agent', 'producer', 'coop_admin'].includes(role);
};

export const canAccessPlatform = (role: UserRole, platform: Platform): boolean => {
  if (platform === 'web') {
    return WEB_ROLES.includes(role);
  } else if (platform === 'mobile') {
    return MOBILE_ROLES.includes(role);
  }
  return false;
};

export const getRoleDisplayName = (role: UserRole): string => {
  return ROLE_CONFIG[role]?.displayName || 'Rôle inconnu';
};

export const getRoleDescription = (role: UserRole): string => {
  return ROLE_CONFIG[role]?.description || 'Description non disponible';
};

export const getRolePlatform = (role: UserRole): Platform => {
  return ROLE_CONFIG[role]?.platform || 'web';
};

export const getRoleColor = (role: UserRole): string => {
  return ROLE_CONFIG[role]?.color || 'gray';
};

export const getRoleIcon = (role: UserRole): string => {
  return ROLE_CONFIG[role]?.icon || 'user';
};

// Permission checking functions
export const hasPermission = (role: UserRole, permission: keyof RolePermissions): boolean => {
  const permissions: Record<UserRole, RolePermissions> = {
    admin: {
      can_manage_users: true,
      can_manage_cooperatives: true,
      can_manage_producers: true,
      can_manage_plots: true,
      can_manage_crops: true,
      can_manage_operations: true,
      can_manage_observations: true,
      can_manage_recommendations: true,
      can_view_analytics: true,
      can_manage_system: true
    },
    supervisor: {
      can_manage_users: true,
      can_manage_cooperatives: true,
      can_manage_producers: true,
      can_manage_plots: true,
      can_manage_crops: true,
      can_manage_operations: true,
      can_manage_observations: true,
      can_manage_recommendations: true,
      can_view_analytics: true,
      can_manage_system: false
    },
    coop_admin: {
      can_manage_users: false,
      can_manage_cooperatives: true,
      can_manage_producers: false,
      can_manage_plots: false,
      can_manage_crops: false,
      can_manage_operations: false,
      can_manage_observations: false,
      can_manage_recommendations: false,
      can_view_analytics: false,
      can_manage_system: false
    },
    agent: {
      can_manage_users: false,
      can_manage_cooperatives: false,
      can_manage_producers: true,
      can_manage_plots: true,
      can_manage_crops: true,
      can_manage_operations: true,
      can_manage_observations: true,
      can_manage_recommendations: true,
      can_view_analytics: false,
      can_manage_system: false
    },
    producer: {
      can_manage_users: false,
      can_manage_cooperatives: false,
      can_manage_producers: false,
      can_manage_plots: false,
      can_manage_crops: false,
      can_manage_operations: false,
      can_manage_observations: false,
      can_manage_recommendations: false,
      can_view_analytics: false,
      can_manage_system: false
    }
  };

  return permissions[role]?.[permission] || false;
};

// Role hierarchy (for role transitions)
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'supervisor', 'coop_admin', 'agent', 'producer'],
  supervisor: ['supervisor', 'agent', 'producer'],
  coop_admin: ['coop_admin', 'producer'],
  agent: ['agent', 'producer'],
  producer: ['producer']
};

export const canAssignRole = (assignerRole: UserRole, targetRole: UserRole): boolean => {
  return ROLE_HIERARCHY[assignerRole]?.includes(targetRole) || false;
};

// Export all role-related functions
export const UserRoleUtils = {
  isValidUserRole,
  canAccessPlatform,
  getRoleDisplayName,
  getRoleDescription,
  getRolePlatform,
  getRoleColor,
  getRoleIcon,
  hasPermission,
  canAssignRole,
  WEB_ROLES,
  MOBILE_ROLES,
  ROLE_CONFIG
};
