# Dual Authentication Implementation Plan - AgriConnect

## Overview

Ce document détaille le plan d'implémentation de la **stratégie d'authentification duale** d'AgriConnect : OTP SMS pour l'application mobile et Email/Password pour l'application web. L'implémentation se fait en 4 phases sur 4 semaines.

---

## **Phase 1: Configuration Supabase Auth Duale (Semaine 1)** ⚙️

### **Objectif**
Configurer Supabase Auth pour supporter les deux méthodes d'authentification : OTP SMS (Mobile) et Email/Password (Web).

### **Tâches Détaillées**

#### **1.1 Configuration OTP SMS avec Twilio**
- [ ] **Créer compte Twilio** (si pas existant)
  - Obtenir Account SID, Auth Token, Message Service SID
  - Configurer le numéro de téléphone d'envoi
  - Tester l'envoi de SMS

- [ ] **Configuration Supabase Dashboard**
  ```typescript
  // Supabase > Auth > Providers > Phone
  {
    "enabled": true,
    "provider": "twilio",
    "twilio_account_sid": "env.TWILIO_ACCOUNT_SID",
    "twilio_auth_token": "env.TWILIO_AUTH_TOKEN",
    "twilio_message_service_sid": "env.TWILIO_MESSAGE_SERVICE_SID"
  }
  ```

- [ ] **Configuration des Templates SMS**
  ```typescript
  // Template OTP
  "Votre code AgriConnect: {{ .Code }}"
  
  // Paramètres
  "expiry": 600,        // 10 minutes
  "rate_limit": 3,      // 3 tentatives par heure
  "should_create_user": false
  ```

#### **1.2 Configuration Email/Password avec SMTP**
- [ ] **Configuration SMTP dans Supabase**
  ```typescript
  // Supabase > Auth > SMTP
  {
    "enabled": true,
    "host": "env.SMTP_HOST",
    "port": 587,
    "user": "env.SMTP_USER",
    "pass": "env.SMTP_PASS",
    "admin_email": "admin@agriconnect.sn"
  }
  ```

- [ ] **Configuration Email Provider**
  ```typescript
  // Supabase > Auth > Providers > Email
  {
    "enabled": true,
    "double_confirm_changes": true,
    "enable_signup": false,  // Création manuelle par admin
    "confirm_email_change": true
  }
  ```

#### **1.3 Configuration des Variables d'Environnement**
- [ ] **Mise à jour `.env.example`**
  ```bash
  # Twilio Configuration
  TWILIO_ACCOUNT_SID=your_account_sid
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_MESSAGE_SERVICE_SID=your_message_service_sid
  
  # SMTP Configuration
  SMTP_HOST=smtp.gmail.com
  SMTP_USER=your_email@gmail.com
  SMTP_PASS=your_app_password
  ```

- [ ] **Mise à jour des fichiers d'environnement**
  - `mobile/.env`
  - `web/.env`
  - `supabase/.env`

#### **1.4 Tests de Configuration**
- [ ] **Test OTP SMS**
  - Envoi de code OTP vers un numéro de test
  - Vérification de la réception
  - Validation de l'expiration

- [ ] **Test Email/Password**
  - Envoi d'email de confirmation
  - Test de réinitialisation de mot de passe
  - Validation des templates

### **Livrables Phase 1**
- ✅ Configuration OTP SMS Twilio fonctionnelle
- ✅ Configuration SMTP Email/Password fonctionnelle
- ✅ Variables d'environnement configurées
- ✅ Tests de configuration validés

---

## **Phase 2: Authentification Mobile OTP SMS (Semaine 2)** 📱

### **Objectif**
Implémenter l'authentification OTP SMS pour l'application mobile React Native, incluant les écrans de connexion et la gestion des sessions.

### **Tâches Détaillées**

#### **2.1 Service d'Authentification Mobile**
- [ ] **Créer `mobile/lib/auth/mobileAuthService.ts`**
  ```typescript
  export class MobileAuthService {
    static async sendOTP(phone: string): Promise<void>
    static async verifyOTP(phone: string, otp: string): Promise<AuthSession>
    static async getCurrentSession(): Promise<AuthSession | null>
    static async refreshSession(): Promise<AuthSession>
    static async signOut(): Promise<void>
  }
  ```

- [ ] **Gestionnaire de Sessions**
  ```typescript
  // mobile/lib/auth/sessionManager.ts
  export class SessionManager {
    static async ensureValidSession(): Promise<AuthSession>
    static async refreshSession(): Promise<AuthSession>
    static async clearSession(): Promise<void>
  }
  ```

#### **2.2 Écrans d'Authentification Mobile**
- [ ] **Écran de Connexion** (`mobile/app/(auth)/login.tsx`)
  ```typescript
  // Composants
  - PhoneInput: Saisie du numéro de téléphone
  - SendOTPButton: Envoi du code OTP
  - OTPInput: Saisie du code OTP
  - VerifyOTPButton: Vérification du code
  - LoadingStates: États de chargement
  - ErrorMessages: Gestion des erreurs
  ```

- [ ] **Écran d'Inscription** (`mobile/app/(auth)/register.tsx`)
  ```typescript
  // Composants
  - UserTypeSelector: Agent ou Producteur
  - PhoneInput: Numéro de téléphone
  - CooperativeSelector: Sélection coopérative
  - SendOTPButton: Envoi OTP
  - OTPVerification: Vérification OTP
  - ProfileCompletion: Complétion profil
  ```

#### **2.3 Gestion des États d'Authentification**
- [ ] **Context d'Authentification** (`mobile/context/AuthContext.tsx`)
  ```typescript
  interface AuthContextType {
    user: User | null
    session: AuthSession | null
    loading: boolean
    signIn: (phone: string) => Promise<void>
    verifyOTP: (phone: string, otp: string) => Promise<void>
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
  }
  ```

- [ ] **Hook d'Authentification** (`mobile/hooks/useAuth.ts`)
  ```typescript
  export const useAuth = () => {
    const { user, session, loading, signIn, verifyOTP, signOut } = useContext(AuthContext)
    return { user, session, loading, signIn, verifyOTP, signOut }
  }
  ```

#### **2.4 Navigation et Protection des Routes**
- [ ] **Protection des Routes** (`mobile/app/_layout.tsx`)
  ```typescript
  // Vérification de l'authentification
  const { session, loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  if (!session) return <AuthNavigator />
  return <MainNavigator />
  ```

- [ ] **Gestion des Redirections**
  - Redirection automatique après connexion
  - Protection des routes authentifiées
  - Gestion des sessions expirées

#### **2.5 Tests OTP SMS**
- [ ] **Tests Unitaires**
  - Test du service d'authentification
  - Test de la gestion des sessions
  - Test de la validation des entrées

- [ ] **Tests d'Intégration**
  - Test complet du flux OTP SMS
  - Test de la gestion des erreurs
  - Test de la persistance des sessions

### **Livrables Phase 2**
- ✅ Service d'authentification mobile OTP SMS
- ✅ Écrans de connexion/inscription mobile
- ✅ Gestion des sessions JWT pour mobile
- ✅ Tests OTP SMS validés
- ✅ Navigation et protection des routes

---

## **Phase 3: Authentification Web Email/Password (Semaine 3)** 🌐

### **Objectif**
Implémenter l'authentification Email/Password pour l'application web React, incluant les écrans de connexion et la gestion des sessions.

### **Tâches Détaillées**

#### **3.1 Service d'Authentification Web**
- [ ] **Créer `web/src/services/webAuthService.ts`**
  ```typescript
  export class WebAuthService {
    static async signIn(email: string, password: string): Promise<AuthSession>
    static async createUser(email: string, password: string, role: WebUserRole): Promise<void>
    static async resetPassword(email: string): Promise<void>
    static async getCurrentSession(): Promise<AuthSession | null>
    static async signOut(): Promise<void>
  }
  ```

- [ ] **Gestionnaire de Sessions Web**
  ```typescript
  // web/src/services/sessionManager.ts
  export class WebSessionManager {
    static async ensureValidSession(): Promise<AuthSession>
    static async refreshSession(): Promise<AuthSession>
    static async clearSession(): Promise<void>
  }
  ```

#### **3.2 Écrans d'Authentification Web**
- [ ] **Page de Connexion** (`web/src/pages/auth/Login.tsx`)
  ```typescript
  // Composants
  - EmailInput: Saisie de l'email
  - PasswordInput: Saisie du mot de passe
  - SignInButton: Bouton de connexion
  - ForgotPasswordLink: Lien mot de passe oublié
  - LoadingStates: États de chargement
  - ErrorMessages: Gestion des erreurs
  ```

- [ ] **Page d'Inscription** (`web/src/pages/auth/Signup.tsx`)
  ```typescript
  // Composants
  - EmailInput: Saisie de l'email
  - PasswordInput: Saisie du mot de passe
  - ConfirmPasswordInput: Confirmation du mot de passe
  - RoleSelector: Sélection du rôle (Admin/Superviseur)
  - CooperativeSelector: Sélection coopérative
  - SignUpButton: Bouton d'inscription
  ```

- [ ] **Page de Réinitialisation** (`web/src/pages/auth/ResetPassword.tsx`)
  ```typescript
  // Composants
  - EmailInput: Saisie de l'email
  - SendResetButton: Envoi du lien de réinitialisation
  - NewPasswordInput: Nouveau mot de passe
  - ConfirmPasswordInput: Confirmation du mot de passe
  - UpdatePasswordButton: Mise à jour du mot de passe
  ```

#### **3.3 Gestion des États d'Authentification Web**
- [ ] **Context d'Authentification Web** (`web/src/context/AuthContext.tsx`)
  ```typescript
  interface WebAuthContextType {
    user: User | null
    session: AuthSession | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, role: WebUserRole) => Promise<void>
    resetPassword: (email: string) => Promise<void>
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
  }
  ```

- [ ] **Hook d'Authentification Web** (`web/src/hooks/useAuth.ts`)
  ```typescript
  export const useAuth = () => {
    const { user, session, loading, signIn, signUp, resetPassword, signOut } = useContext(WebAuthContext)
    return { user, session, loading, signIn, signUp, resetPassword, signOut }
  }
  ```

#### **3.4 Navigation et Protection des Routes Web**
- [ ] **Protection des Routes** (`web/src/components/Layout/Layout.tsx`)
  ```typescript
  // Vérification de l'authentification
  const { session, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!session) return <AuthLayout />
  return <MainLayout />
  ```

- [ ] **Gestion des Redirections Web**
  - Redirection automatique après connexion
  - Protection des routes authentifiées
  - Gestion des sessions expirées
  - Redirection vers la page appropriée selon le rôle

#### **3.5 Tests Email/Password**
- [ ] **Tests Unitaires**
  - Test du service d'authentification web
  - Test de la gestion des sessions
  - Test de la validation des entrées

- [ ] **Tests d'Intégration**
  - Test complet du flux Email/Password
  - Test de la gestion des erreurs
  - Test de la persistance des sessions
  - Test de la réinitialisation de mot de passe

### **Livrables Phase 3**
- ✅ Service d'authentification web Email/Password
- ✅ Écrans de connexion/inscription web
- ✅ Gestion des sessions JWT pour web
- ✅ Tests Email/Password validés
- ✅ Navigation et protection des routes web

---

## **Phase 4: Intégration et Validation (Semaine 4)** 🔗

### **Objectif**
Valider l'intégration complète de l'authentification duale, tester les rôles et plateformes, et valider la sécurité globale.

### **Tâches Détaillées**

#### **4.1 Validation des Rôles et Plateformes**
- [ ] **Middleware de Validation Plateforme**
  ```typescript
  // lib/middleware/platformValidation.ts
  export const validatePlatformAccess = (userRole: string, platform: 'mobile' | 'web'): boolean => {
    const mobileRoles = ['agent', 'producer']
    const webRoles = ['admin', 'supervisor']
    
    if (platform === 'mobile' && !mobileRoles.includes(userRole)) {
      throw new Error('Accès mobile non autorisé pour ce rôle')
    }
    
    if (platform === 'web' && !webRoles.includes(userRole)) {
      throw new Error('Accès web non autorisé pour ce rôle')
    }
    
    return true
  }
  ```

- [ ] **Validation des Permissions par Rôle**
  ```typescript
  // lib/auth/rolePermissions.ts
  export const getRolePermissions = (role: UserRole, platform: Platform) => {
    const permissions = {
      agent: ['read_producers', 'create_plots', 'update_observations'],
      producer: ['read_own_plots', 'update_own_observations'],
      supervisor: ['read_cooperative_data', 'validate_agent_data'],
      admin: ['read_all_data', 'manage_users', 'system_config']
    }
    
    return permissions[role] || []
  }
  ```

#### **4.2 Tests RLS et Permissions**
- [ ] **Tests des Politiques RLS**
  ```sql
  -- Test d'accès aux producteurs selon le rôle et la plateforme
  -- Doit échouer si un agent tente d'accéder depuis le web
  -- Doit échouer si un admin tente d'accéder depuis le mobile
  ```

- [ ] **Tests de Sécurité**
  - Test d'accès non autorisé par plateforme
  - Test d'accès non autorisé par rôle
  - Test de contournement des politiques RLS
  - Test de validation des tokens JWT

#### **4.3 Tests Complets d'Authentification Duale**
- [ ] **Tests End-to-End Mobile**
  ```typescript
  // Test complet du flux OTP SMS
  1. Saisie numéro de téléphone
  2. Envoi OTP SMS
  3. Réception et saisie du code
  4. Vérification et création de session
  5. Accès aux fonctionnalités autorisées
  6. Test de déconnexion
  ```

- [ ] **Tests End-to-End Web**
  ```typescript
  // Test complet du flux Email/Password
  1. Saisie email et mot de passe
  2. Connexion et création de session
  3. Accès aux fonctionnalités autorisées
  4. Test de réinitialisation de mot de passe
  5. Test de déconnexion
  ```

#### **4.4 Validation de la Sécurité**
- [ ] **Tests de Sécurité**
  - Test d'injection SQL
  - Test de XSS
  - Test de CSRF
  - Test de brute force sur OTP
  - Test de brute force sur mot de passe

- [ ] **Audit de Sécurité**
  - Vérification des politiques RLS
  - Validation des tokens JWT
  - Vérification des logs d'audit
  - Test de la séparation des plateformes

#### **4.5 Tests de Performance**
- [ ] **Tests de Performance Mobile**
  - Temps de réponse OTP SMS
  - Performance de l'authentification
  - Gestion des sessions en mémoire

- [ ] **Tests de Performance Web**
  - Temps de réponse Email/Password
  - Performance de l'authentification
  - Gestion des sessions côté serveur

### **Livrables Phase 4**
- ✅ Validation des rôles et plateformes
- ✅ Tests RLS et permissions validés
- ✅ Tests complets d'authentification duale
- ✅ Validation de la sécurité globale
- ✅ Tests de performance validés

---

## **Livrables Finaux** 🎯

### **Fonctionnalités Implémentées**
- ✅ **Authentification Mobile OTP SMS** : Agents et Producteurs
- ✅ **Authentification Web Email/Password** : Admins et Superviseurs
- ✅ **Séparation des Plateformes** : Validation stricte plateforme + rôle
- ✅ **Gestion des Sessions JWT** : Sessions adaptées par plateforme
- ✅ **Sécurité RLS** : Politiques de sécurité par plateforme et rôle
- ✅ **Audit et Logs** : Traçabilité complète des authentifications

### **Architecture Finale**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Applications                    │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   Mobile App   │    │    Web App      │               │
│  │  (React Native)│    │   (React)       │               │
│  │                 │    │                 │               │
│  │ • OTP SMS      │    │ • Email/Password│               │
│  │ • Agents       │    │ • Admins        │               │
│  │ • Producteurs  │    │ • Superviseurs  │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                        │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   PostgREST     │    │  Edge Functions │               │
│  │   (90% CRUD)    │    │  (10% Utils)    │               │
│  │                 │    │                 │               │
│  │ • 273 endpoints│    │ • Modules partagés│              │
│  │ • Auto-généré   │    │ • Documentation  │               │
│  │ • Haute perf    │    │ • Monitoring     │               │
│  │ • Zero maint    │    │ • Utilitaires    │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Supabase Auth Dual (Natif)                      │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   OTP SMS      │    │ Email/Password  │               │
│  │   (Mobile)     │    │   (Web)         │               │
│  │                 │    │                 │               │
│  │ • Agents       │    │ • Admins        │               │
│  │ • Producteurs  │    │ • Superviseurs  │               │
│  │ • Twilio       │    │ • SMTP          │               │
│  │ • JWT 24h      │    │ • JWT 8h        │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## **Risques et Mitigations** ⚠️

### **Risques Techniques**
- **Risque** : Configuration complexe de Twilio et SMTP
- **Mitigation** : Documentation détaillée, tests de configuration

- **Risque** : Gestion des sessions multiples par utilisateur
- **Mitigation** : Validation plateforme stricte, logs d'audit

- **Risque** : Tests complexes avec deux méthodes d'authentification
- **Mitigation** : Tests séparés par plateforme, validation croisée

### **Risques de Sécurité**
- **Risque** : Contournement de la séparation plateforme
- **Mitigation** : Validation côté serveur, politiques RLS strictes

- **Risque** : Attaques sur OTP SMS
- **Mitigation** : Rate limiting, expiration courte, validation stricte

### **Risques de Performance**
- **Risque** : Latence OTP SMS
- **Mitigation** : Configuration Twilio optimisée, fallback en cas d'échec

- **Risque** : Gestion des sessions côté serveur
- **Mitigation** : Sessions JWT optimisées, refresh automatique

---

## **Conclusion** 🎯

Ce plan d'implémentation de **4 semaines** garantit une **authentification duale complète et sécurisée** pour AgriConnect :

1. **Semaine 1** : Configuration Supabase Auth duale
2. **Semaine 2** : Implémentation authentification mobile OTP SMS
3. **Semaine 3** : Implémentation authentification web Email/Password
4. **Semaine 4** : Intégration, validation et tests de sécurité

L'approche **mobile-first** avec **séparation stricte des plateformes** garantit une **sécurité maximale** et une **expérience utilisateur optimisée** pour chaque contexte d'usage.

---

**Dernière mise à jour** : 31 Août 2025  
**Statut** : Plan d'implémentation défini  
**Prochaine étape** : Début de la Phase 1 - Configuration Supabase Auth
