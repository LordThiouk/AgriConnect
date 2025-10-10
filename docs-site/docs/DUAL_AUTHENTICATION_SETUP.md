# Guide de Configuration - Authentification Duale AgriConnect

## Vue d'ensemble

AgriConnect utilise une **authentification duale** optimisée par plateforme :

- **📱 Mobile (React Native)** : OTP SMS via Twilio pour Agents et Producteurs
- **🌐 Web (React)** : Email/Password via SMTP pour Admins et Superviseurs

## Configuration Supabase Auth

### 1. Configuration SMS (Mobile)

Dans `supabase/config.toml` :

```toml
[auth.sms]
enable_signup = true
enable_confirmations = true
template = "Votre code AgriConnect est {{ .Code }}"

[auth.sms.twilio]
enabled = true
account_sid = "env(TWILIO_ACCOUNT_SID)"
message_service_sid = "env(TWILIO_MESSAGE_SERVICE_SID)"
auth_token = "env(TWILIO_AUTH_TOKEN)"
```

### 2. Configuration Email (Web)

Dans `supabase/config.toml` :

```toml
[auth.email]
enable_signup = true
enable_confirmations = false

[auth.email.smtp]
enabled = true
host = "env(SMTP_HOST)"
port = 587
user = "env(SMTP_USER)"
pass = "env(SMTP_PASS)"
admin_email = "env(SMTP_FROM)"
sender_name = "AgriConnect"
```

## Variables d'Environnement

### Variables Twilio (SMS)

```bash
# Twilio Configuration (OTP SMS for Mobile)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_MESSAGE_SERVICE_SID=your_twilio_message_service_sid
```

### Variables SMTP (Email)

```bash
# SMTP Configuration (Email/Password for Web)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=admin@agriconnect.sn
```

## Services d'Authentification

### Mobile Service (`mobile/lib/auth/mobileAuthService.ts`)

```typescript
// Envoi OTP SMS
const { error } = await sendOtpSms('+221701234567');

// Vérification OTP
const { user, session, error } = await verifyOtpSms('+221701234567', '123456');
```

### Web Service (`web/src/services/webAuthService.ts`)

```typescript
// Connexion Email/Password
const { user, session, error } = await signInWithPassword('admin@agriconnect.sn', 'password');

// Inscription
const { user, session, error } = await signUp('admin@agriconnect.sn', 'password', {
  full_name: 'Admin User',
  role: 'admin'
});
```

## Écrans d'Authentification

### Mobile (`mobile/app/(auth)/login.tsx`)

- **Étape 1** : Saisie du numéro de téléphone sénégalais
- **Étape 2** : Saisie du code OTP reçu par SMS
- **Validation** : Format +221XXXXXXXXX
- **Rôles** : Agents et Producteurs uniquement

### Web (`web/src/pages/auth/Login.tsx`)

- **Champs** : Email et mot de passe
- **Validation** : Format email et force du mot de passe
- **Rôles** : Admins et Superviseurs uniquement

## Séparation des Rôles par Plateforme

### Mobile (OTP SMS)
- **Agents de terrain** : Collecte de données, ajout de producteurs
- **Producteurs** : Suivi de parcelles, réception d'alertes

### Web (Email/Password)
- **Administrateurs** : Gestion globale, supervision
- **Superviseurs** : Validation des données, rapports

## Tests d'Authentification

### Test Mobile OTP SMS

1. **Démarrer l'app mobile** : `cd mobile && npm start`
2. **Saisir un numéro** : +221701234567
3. **Vérifier l'envoi** : SMS reçu avec code OTP
4. **Saisir le code** : 123456 (ou code reçu)
5. **Vérifier la connexion** : Redirection vers dashboard

### Test Web Email/Password

1. **Démarrer l'app web** : `cd web && npm run dev`
2. **Accéder à /login** : Interface de connexion
3. **Saisir les credentials** : admin@agriconnect.sn / password
4. **Vérifier la connexion** : Redirection vers dashboard

## Sécurité et RLS

### Row Level Security (RLS)

Les politiques RLS sont automatiquement appliquées selon :

- **Plateforme** : Mobile vs Web
- **Rôle utilisateur** : Agent, Producteur, Admin, Superviseur
- **Coopérative** : Accès limité aux données de la coopérative

### Validation des Rôles

```typescript
// Vérification du rôle par plateforme
const user = await getCurrentUser();
const userRole = user?.user_metadata?.role;

// Mobile : Agents et Producteurs
if (Platform.OS !== 'web' && !['agent', 'producer'].includes(userRole)) {
  throw new Error('Accès non autorisé sur mobile');
}

// Web : Admins et Superviseurs
if (Platform.OS === 'web' && !['admin', 'supervisor'].includes(userRole)) {
  throw new Error('Accès non autorisé sur web');
}
```

## Dépannage

### Problèmes SMS

1. **Vérifier Twilio** : Credentials corrects dans .env
2. **Format téléphone** : +221XXXXXXXXX obligatoire
3. **Limite de taux** : 30 SMS/heure par défaut

### Problèmes Email

1. **Vérifier SMTP** : Credentials corrects dans .env
2. **Gmail App Password** : Utiliser un mot de passe d'application
3. **Limite de taux** : 2 emails/heure par défaut

### Problèmes de Connexion

1. **Vérifier Supabase** : URL et clés correctes
2. **Vérifier RLS** : Politiques activées
3. **Vérifier les rôles** : Utilisateur a le bon rôle

## Avantages de l'Architecture Duale

### Performance
- **Mobile** : OTP SMS rapide et fiable
- **Web** : Email/Password familier pour les admins

### Sécurité
- **Séparation plateforme** : Méthodes d'auth différentes
- **RLS automatique** : Sécurité par rôle intégrée
- **Validation native** : Supabase Auth gère tout

### Maintenance
- **Code minimal** : Services d'auth simples
- **Configuration centralisée** : Tout dans Supabase
- **Évolutivité** : Facile d'ajouter d'autres méthodes

## Prochaines Étapes

1. **Configurer Twilio** : Obtenir les credentials
2. **Configurer SMTP** : Configurer l'envoi d'emails
3. **Tester l'authentification** : Mobile et Web
4. **Valider les rôles** : Vérifier RLS et permissions
5. **Déployer** : Mise en production

---

**🎯 Résultat** : Authentification duale fonctionnelle avec Supabase Auth natif, optimisée par plateforme et rôle utilisateur.
