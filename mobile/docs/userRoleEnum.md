# User Role Enum Implementation - AgriConnect

## **Enum PostgreSQL + TypeScript Types + Validation Functions**

**Last Updated**: September 5, 2025  
**Status**: Implementation Complete ✅

---

## 1. **Overview**

L'implémentation de l'enum des rôles utilisateur pour AgriConnect fournit une validation stricte des rôles au niveau base de données avec des types TypeScript synchronisés et des fonctions de validation complètes.

### **Problème Résolu**
- **Avant** : Rôles stockés comme TEXT avec contraintes CHECK
- **Après** : Enum PostgreSQL strict avec validation automatique

---

## 2. **PostgreSQL Enum Implementation**

### **Type Enum Créé**
```sql
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'supervisor', 
  'agent',
  'producer',
  'coop_admin'
);
```

### **Migration Appliquée**
- **Fichier** : `supabase/migrations/20250830020006_add_user_role_enum.sql`
- **Status** : ✅ Appliquée avec succès
- **Tables mises à jour** : `profiles`, `auth_logs`

### **Fonctions de Validation**
```sql
-- Validation des rôles
CREATE FUNCTION public.validate_user_role(role_text TEXT) RETURNS BOOLEAN;

-- Conversion texte vers enum
CREATE FUNCTION public.role_text_to_enum(role_text TEXT) RETURNS public.user_role;

-- Conversion enum vers texte
CREATE FUNCTION public.role_enum_to_text(role_enum public.user_role) RETURNS TEXT;

-- Vérification d'accès plateforme
CREATE FUNCTION public.can_access_platform(role_text TEXT, platform TEXT) RETURNS BOOLEAN;

-- Nom d'affichage du rôle
CREATE FUNCTION public.get_role_display_name(role_text TEXT) RETURNS TEXT;
```

### **Trigger de Validation**
```sql
-- Validation automatique des rôles
CREATE TRIGGER trigger_validate_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role();
```

---

## 3. **TypeScript Types Implementation**

### **Types Globaux**
```typescript
// types/user.ts
export type UserRole = 'admin' | 'supervisor' | 'agent' | 'producer' | 'coop_admin';

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
```

### **Configuration des Rôles**
```typescript
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
```

### **Utilitaires de Validation**
```typescript
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
```

---

## 4. **Frontend Integration**

### **AuthContext Mis à Jour**
```typescript
// web/src/context/AuthContext.tsx
const getUserRole = (): UserRole | null => {
  const role = state.user?.user_metadata?.role;
  return role && ['admin', 'supervisor', 'agent', 'producer', 'coop_admin'].includes(role) 
    ? role as UserRole 
    : null;
};

const isPlatformAllowed = (): boolean => {
  const role = getUserRole();
  return role ? ['admin', 'supervisor', 'coop_admin'].includes(role) : false;
};
```

### **ProtectedRoute Mis à Jour**
```typescript
// web/src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole; // Type strict au lieu de string
  fallback?: ReactNode;
}
```

### **Types Database Mis à Jour**
```typescript
// lib/supabase/types/database.ts
export type UserRole = 'admin' | 'supervisor' | 'agent' | 'producer' | 'coop_admin';

// Dans la table profiles
profiles: {
  Row: {
    role: UserRole | null; // Type strict
    // ... autres champs
  }
}
```

---

## 5. **Validation et Tests**

### **Tests de Validation**
- **Script** : `scripts/test-enum-validation.js`
- **Status** : ✅ Tests passés avec succès
- **Résultats** :
  - ✅ Fonctions de validation opérationnelles
  - ✅ Vue des statistiques de rôles fonctionnelle
  - ✅ Validation des rôles invalides (rejetés comme attendu)

### **Tests de Rôles**
- **Script** : `scripts/test-role-validation.js`
- **Status** : ✅ Tests passés avec succès
- **Résultats** :
  - ✅ Logique de validation des rôles fonctionne correctement
  - ✅ Politiques RLS activées
  - ✅ Validation des rôles après connexion

---

## 6. **Sécurité et Validation**

### **Validation Stricte**
- **Base de données** : Enum PostgreSQL empêche les rôles invalides
- **Trigger** : Validation automatique à l'insertion/mise à jour
- **TypeScript** : Types stricts empêchent les erreurs de typage
- **Frontend** : Validation des rôles après authentification

### **Séparation des Plateformes**
- **Web** : `admin`, `supervisor`, `coop_admin`
- **Mobile** : `agent`, `producer`
- **Validation** : Fonction `canAccessPlatform` pour vérifier l'accès

### **Permissions Granulaires**
- **Fonction** : `hasPermission` pour vérifier les permissions
- **Hiérarchie** : `canAssignRole` pour les transitions de rôles
- **Configuration** : `ROLE_CONFIG` pour les métadonnées des rôles

---

## 7. **Avantages de l'Implémentation**

### **Sécurité Renforcée**
- ✅ **Validation stricte** : Rôles validés au niveau base de données
- ✅ **Types cohérents** : TypeScript synchronisé avec PostgreSQL
- ✅ **Prévention d'erreurs** : Impossible d'insérer des rôles invalides
- ✅ **Audit trail** : Logs des changements de rôles

### **Maintenabilité**
- ✅ **Code centralisé** : Configuration des rôles dans un seul endroit
- ✅ **Types stricts** : Erreurs de typage détectées à la compilation
- ✅ **Fonctions utilitaires** : Logique de validation réutilisable
- ✅ **Documentation** : Types et fonctions auto-documentés

### **Performance**
- ✅ **Validation instantanée** : Enum PostgreSQL très rapide
- ✅ **Index optimisé** : Index sur la colonne role pour les requêtes
- ✅ **Cache TypeScript** : Types compilés pour performance maximale
- ✅ **Requêtes optimisées** : RLS avec enum pour filtrage efficace

---

## 8. **Utilisation**

### **Validation d'un Rôle**
```typescript
import { UserRoleUtils } from '../../../types/user';

const userRole = 'admin' as UserRole;
if (UserRoleUtils.isValidUserRole(userRole)) {
  // Rôle valide
}
```

### **Vérification d'Accès Plateforme**
```typescript
const canAccess = UserRoleUtils.canAccessPlatform('admin', 'web'); // true
const cannotAccess = UserRoleUtils.canAccessPlatform('agent', 'web'); // false
```

### **Vérification de Permissions**
```typescript
const canManage = UserRoleUtils.hasPermission('admin', 'can_manage_users'); // true
const cannotManage = UserRoleUtils.hasPermission('producer', 'can_manage_users'); // false
```

### **Affichage du Rôle**
```typescript
const displayName = UserRoleUtils.getRoleDisplayName('agent'); // "Agent de terrain"
const description = UserRoleUtils.getRoleDescription('admin'); // "Accès complet au système"
```

---

## 9. **Prochaines Étapes**

### **Intégration Complète**
- [ ] Intégration complète des services d'authentification
- [ ] Tests end-to-end des flux d'authentification
- [ ] Gestion des erreurs et états de chargement

### **Optimisations**
- [ ] Cache des permissions pour performance
- [ ] Validation côté client pour UX
- [ ] Logs détaillés des changements de rôles

### **Fonctionnalités Futures**
- [ ] Gestion des rôles temporaires
- [ ] Permissions granulaires par ressource
- [ ] Audit trail complet des actions

---

**🎯 Résultat** : L'enum des rôles est maintenant implémenté avec une validation stricte, des types TypeScript cohérents et des fonctions utilitaires complètes pour une sécurité renforcée et une maintenabilité optimale.
