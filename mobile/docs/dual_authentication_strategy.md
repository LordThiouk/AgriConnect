# Dual Authentication Strategy - AgriConnect

## Overview

**AgriConnect** implémente une **stratégie d'authentification duale** qui sépare les méthodes d'authentification selon la plateforme et le rôle utilisateur. Cette approche garantit une sécurité renforcée et une expérience utilisateur optimisée pour chaque contexte d'usage.

---

## **Architecture d'Authentification Duale** 🎯

### **1. Mobile App (React Native) - OTP SMS**
- **Utilisateurs** : Agents de terrain + Producteurs
- **Méthode** : Numéro de téléphone + OTP SMS (Twilio)
- **Cas d'usage** : Collecte terrain, suivi parcelles, observations
- **Avantages** : Simple, rapide, adapté au terrain, pas de mot de passe à retenir

### **2. Web App (React) - Email/Password**
- **Utilisateurs** : Administrateurs + Superviseurs
- **Méthode** : Email + Mot de passe
- **Cas d'usage** : Supervision, analytics, validation données, campagnes
- **Avantages** : Familier, sécurisé, gestion des sessions avancée

---

## **Séparation des Rôles par Plateforme** 🔐

### **Mobile App - Rôles Autorisés**
```typescript
export type MobileUserRole = 'agent' | 'producer';

// Validation plateforme mobile
export const validateMobileAccess = (userRole: string): boolean => {
  return ['agent', 'producer'].includes(userRole);
};
```

### **Web App - Rôles Autorisés**
```typescript
export type WebUserRole = 'admin' | 'supervisor';

// Validation plateforme web
export const validateWebAccess = (userRole: string): boolean => {
  return ['admin', 'supervisor'].includes(userRole);
};
```

### **Matrice d'Accès Plateforme/Rôle**
| Rôle | Mobile (OTP SMS) | Web (Email/Password) | Accès Données |
|------|------------------|---------------------|---------------|
| **Agent** | ✅ Oui | ❌ Non | Ses producteurs assignés |
| **Producteur** | ✅ Oui | ❌ Non | Ses propres données |
| **Superviseur** | ❌ Non | ✅ Oui | Sa coopérative |
| **Admin** | ❌ Non | ✅ Oui | Toutes les données |

---

## **Configuration Supabase Auth Duale** ⚙️

### **1. Configuration OTP SMS (Mobile)**
```typescript
// Supabase Dashboard > Auth > Providers > Phone
{
  "enabled": true,
  "provider": "twilio",
  "twilio_account_sid": "env.TWILIO_ACCOUNT_SID",
  "twilio_auth_token": "env.TWILIO_AUTH_TOKEN",
  "twilio_message_service_sid": "env.TWILIO_MESSAGE_SERVICE_SID",
  "template": "Votre code AgriConnect: {{ .Code }}",
  "expiry": 600, // 10 minutes
  "rate_limit": 3 // 3 tentatives par heure
}
```

### **2. Configuration Email/Password (Web)**
```typescript
// Supabase Dashboard > Auth > Providers > Email
{
  "enabled": true,
  "double_confirm_changes": true,
  "enable_signup": false, // Création manuelle par admin
  "template": {
    "confirmation": "email_confirmation.html",
    "recovery": "password_recovery.html"
  }
}
```

### **3. Configuration SMTP**
```typescript
// Supabase Dashboard > Auth > SMTP
{
  "enabled": true,
  "host": "env.SMTP_HOST",
  "port": 587,
  "user": "env.SMTP_USER",
  "pass": "env.SMTP_PASS",
  "admin_email": "admin@agriconnect.sn"
}
```

---

## **Implémentation Technique** 💻

### **1. Service d'Authentification Mobile**
```typescript
// mobile/lib/auth/mobileAuthService.ts
export class MobileAuthService {
  // Envoi OTP SMS
  static async sendOTP(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: false // Utilisateur doit exister
      }
    });
    
    if (error) throw new Error(`OTP send failed: ${error.message}`);
  }

  // Vérification OTP
  static async verifyOTP(phone: string, otp: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    });
    
    if (error) throw new Error(`OTP verification failed: ${error.message}`);
    return data.session!;
  }

  // Gestion session mobile
  static async getCurrentSession(): Promise<AuthSession | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static async refreshSession(): Promise<AuthSession> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(`Session refresh failed: ${error.message}`);
    return data.session!;
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
```

### **2. Service d'Authentification Web**
```typescript
// web/src/services/webAuthService.ts
export class WebAuthService {
  // Connexion email/password
  static async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new Error(`Sign in failed: ${error.message}`);
    return data.session!;
  }

  // Création compte admin/superviseur (par admin existant)
  static async createUser(email: string, password: string, role: WebUserRole): Promise<void> {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });
    
    if (error) throw new Error(`User creation failed: ${error.message}`);
  }

  // Réinitialisation mot de passe
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(`Password reset failed: ${error.message}`);
  }

  // Gestion session web
  static async getCurrentSession(): Promise<AuthSession | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
```

---

## **Sécurité et Validation** 🛡️

### **1. Middleware de Validation Plateforme**
```typescript
// lib/middleware/platformValidation.ts
export const validatePlatformAccess = (userRole: string, platform: 'mobile' | 'web'): boolean => {
  const mobileRoles = ['agent', 'producer'];
  const webRoles = ['admin', 'supervisor'];
  
  if (platform === 'mobile' && !mobileRoles.includes(userRole)) {
    throw new Error('Accès mobile non autorisé pour ce rôle');
  }
  
  if (platform === 'web' && !webRoles.includes(userRole)) {
    throw new Error('Accès web non autorisé pour ce rôle');
  }
  
  return true;
};
```

### **2. Politiques RLS par Plateforme et Rôle**
```sql
-- Exemple: Accès aux producteurs selon le rôle et la plateforme
CREATE POLICY "producers_platform_role_policy" ON producers
FOR ALL USING (
  -- Admin/Superviseur (Web uniquement)
  (auth.jwt() ->> 'role') IN ('admin', 'supervisor')
  AND
  (auth.jwt() ->> 'platform') = 'web'
  OR
  -- Agent (Mobile uniquement)
  ((auth.jwt() ->> 'role') = 'agent' 
   AND (auth.jwt() ->> 'platform') = 'mobile'
   AND assigned_agent_id = auth.uid())
  OR
  -- Producteur (Mobile uniquement)
  ((auth.jwt() ->> 'role') = 'producer' 
   AND (auth.jwt() ->> 'platform') = 'mobile'
   AND profile_id = auth.uid())
);
```

### **3. Audit et Logs d'Authentification**
```sql
-- Table de logs d'authentification
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL CHECK (platform IN ('mobile', 'web')),
  auth_method TEXT NOT NULL CHECK (auth_method IN ('otp_sms', 'email_password')),
  user_role TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour logging automatique
CREATE OR REPLACE FUNCTION log_auth_attempt()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auth_logs (user_id, platform, auth_method, user_role, success)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'platform', 'unknown'),
    CASE 
      WHEN NEW.phone IS NOT NULL THEN 'otp_sms'
      ELSE 'email_password'
    END,
    COALESCE(NEW.raw_user_meta_data->>'role', 'unknown'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## **Gestion des Sessions JWT** 🔑

### **1. Configuration JWT par Plateforme**
```typescript
// Configuration JWT différenciée
const JWT_CONFIG = {
  mobile: {
    expiresIn: '24h', // Sessions longues pour collecte terrain
    refreshThreshold: '1h' // Renouvellement automatique
  },
  web: {
    expiresIn: '8h', // Sessions courtes pour sécurité admin
    refreshThreshold: '30m' // Renouvellement fréquent
  }
};
```

### **2. Renouvellement Automatique des Sessions**
```typescript
// mobile/lib/auth/sessionManager.ts
export class SessionManager {
  static async ensureValidSession(): Promise<AuthSession> {
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      throw new Error('Session expirée, reconnexion requise');
    }
    
    // Vérifier si renouvellement nécessaire
    const expiresAt = new Date(session.data.session.expires_at! * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry < 60 * 60 * 1000) { // 1 heure
      return await this.refreshSession();
    }
    
    return session.data.session;
  }

  static async refreshSession(): Promise<AuthSession> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(`Session refresh failed: ${error.message}`);
    return data.session!;
  }
}
```

---

## **Plan d'Implémentation** 📋

### **Phase 1: Configuration Supabase Auth (Semaine 1)**
- [ ] Configuration OTP SMS avec Twilio
- [ ] Configuration Email/Password avec SMTP
- [ ] Templates et paramètres d'authentification
- [ ] Tests de configuration

### **Phase 2: Authentification Mobile OTP SMS (Semaine 2)**
- [ ] Service d'authentification mobile
- [ ] Écrans de connexion/inscription
- [ ] Gestion des sessions JWT
- [ ] Tests OTP SMS

### **Phase 3: Authentification Web Email/Password (Semaine 3)**
- [ ] Service d'authentification web
- [ ] Écrans de connexion/inscription
- [ ] Gestion des sessions JWT
- [ ] Tests email/password

### **Phase 4: Intégration et Validation (Semaine 4)**
- [ ] Validation des rôles et plateformes
- [ ] Tests RLS et permissions
- [ ] Tests complets d'authentification duale
- [ ] Validation de la sécurité

---

## **Avantages de cette Stratégie** ✅

### **1. Sécurité Renforcée**
- **Séparation claire** des méthodes d'authentification
- **Validation plateforme** + rôle + méthode
- **Audit complet** des connexions par plateforme
- **Isolation** des utilisateurs par contexte

### **2. Expérience Utilisateur Optimisée**
- **Mobile** : OTP SMS simple et rapide pour le terrain
- **Web** : Email/password familier pour les administrateurs
- **Adaptation** au contexte d'usage et aux habitudes

### **3. Maintenance Simplifiée**
- **Supabase Auth natif** pour les deux méthodes
- **Configuration centralisée** dans Supabase
- **Gestion automatique** des sessions et tokens
- **Séparation claire** des responsabilités

---

## **Risques et Mitigations** ⚠️

### **1. Complexité de Configuration**
- **Risque** : Configuration duale plus complexe
- **Mitigation** : Documentation détaillée, tests automatisés

### **2. Gestion des Sessions**
- **Risque** : Sessions multiples par utilisateur
- **Mitigation** : Validation plateforme stricte, logs d'audit

### **3. Tests et Validation**
- **Risque** : Tests plus complexes avec deux méthodes
- **Mitigation** : Tests séparés par plateforme, validation croisée

---

## **Conclusion** 🎯

La **stratégie d'authentification duale** d'AgriConnect offre :

1. **Sécurité maximale** avec séparation plateforme + rôle + méthode
2. **Expérience utilisateur optimisée** selon le contexte d'usage
3. **Architecture maintenable** basée sur Supabase Auth natif
4. **Scalabilité** pour l'ajout futur de nouvelles plateformes

Cette approche garantit que chaque utilisateur accède à l'application via la méthode d'authentification la plus appropriée à son rôle et à son contexte d'usage, tout en maintenant un niveau de sécurité élevé.

---

**Dernière mise à jour** : 31 Août 2025  
**Statut** : Stratégie définie, implémentation en cours  
**Prochaine étape** : Configuration Supabase Auth duale
