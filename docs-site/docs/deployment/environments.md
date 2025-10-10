# 🌍 Gestion des Environnements

Configuration et gestion des environnements de développement, staging et production.

## 🎯 Vue d'ensemble

AgriConnect utilise trois environnements principaux pour le développement et le déploiement.

## 🔧 Environnements

### 1. Development (Développement)

**Objectif :** Développement local et tests

**Configuration :**
```bash
# Variables d'environnement
NODE_ENV=development
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
TWILIO_ACCOUNT_SID=your-test-twilio-sid
TWILIO_AUTH_TOKEN=your-test-twilio-token
```

**Caractéristiques :**
- Base de données locale Supabase
- Logs détaillés activés
- Hot reload activé
- Tests automatiques
- Données de test

### 2. Staging (Pré-production)

**Objectif :** Tests d'intégration et validation

**Configuration :**
```bash
# Variables d'environnement
NODE_ENV=staging
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
TWILIO_ACCOUNT_SID=your-staging-twilio-sid
TWILIO_AUTH_TOKEN=your-staging-twilio-token
```

**Caractéristiques :**
- Base de données de staging
- Données de test réalistes
- Tests d'intégration
- Validation des fonctionnalités
- Environnement de démonstration

### 3. Production

**Objectif :** Application en production

**Configuration :**
```bash
# Variables d'environnement
NODE_ENV=production
SUPABASE_URL=https://production-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
TWILIO_ACCOUNT_SID=your-production-twilio-sid
TWILIO_AUTH_TOKEN=your-production-twilio-token
```

**Caractéristiques :**
- Base de données de production
- Données réelles
- Monitoring activé
- Logs optimisés
- Sécurité renforcée

## 🗄️ Configuration des Bases de Données

### Development

```bash
# Démarrer Supabase local
npx supabase start

# Appliquer les migrations
npx supabase db reset

# Seeder avec des données de test
npx supabase db seed
```

### Staging

```bash
# Lier le projet staging
npx supabase link --project-ref staging-project-ref

# Appliquer les migrations
npx supabase db push

# Copier les données de test
npx supabase db dump --data-only > staging-data.sql
```

### Production

```bash
# Lier le projet production
npx supabase link --project-ref production-project-ref

# Appliquer les migrations
npx supabase db push

# Backup de sécurité
npx supabase db dump --data-only > production-backup.sql
```

## 🔐 Gestion des Secrets

### Development

```bash
# Fichier .env.local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-test-token
```

### Staging

```bash
# Variables d'environnement Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
```

### Production

```bash
# Variables d'environnement Vercel
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
```

## 📱 Configuration Mobile

### Development

```json
{
  "expo": {
    "name": "AgriConnect Dev",
    "slug": "agriconnect-dev",
    "extra": {
      "supabaseUrl": "http://localhost:54321",
      "supabaseAnonKey": "your-local-anon-key"
    }
  }
}
```

### Staging

```json
{
  "expo": {
    "name": "AgriConnect Staging",
    "slug": "agriconnect-staging",
    "extra": {
      "supabaseUrl": "https://staging-project.supabase.co",
      "supabaseAnonKey": "your-staging-anon-key"
    }
  }
}
```

### Production

```json
{
  "expo": {
    "name": "AgriConnect",
    "slug": "agriconnect",
    "extra": {
      "supabaseUrl": "https://production-project.supabase.co",
      "supabaseAnonKey": "your-production-anon-key"
    }
  }
}
```

## 🔔 Configuration des Notifications

### Development

```typescript
// Configuration Twilio de test
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  testMode: true // Mode test activé
};
```

### Staging

```typescript
// Configuration Twilio de staging
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  testMode: false,
  rateLimit: 100 // Limite de 100 SMS/heure
};
```

### Production

```typescript
// Configuration Twilio de production
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  testMode: false,
  rateLimit: 1000 // Limite de 1000 SMS/heure
};
```

## 📊 Monitoring et Logs

### Development

```typescript
// Logs détaillés
const logger = {
  level: 'debug',
  format: 'pretty',
  console: true,
  file: false
};
```

### Staging

```typescript
// Logs modérés
const logger = {
  level: 'info',
  format: 'json',
  console: true,
  file: true
};
```

### Production

```typescript
// Logs optimisés
const logger = {
  level: 'warn',
  format: 'json',
  console: false,
  file: true,
  remote: true // Envoi vers service externe
};
```

## 🧪 Tests par Environnement

### Development

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

### Staging

```bash
# Tests de régression
npm run test:regression

# Tests de performance
npm run test:performance

# Tests de sécurité
npm run test:security
```

### Production

```bash
# Tests de santé
npm run test:health

# Tests de monitoring
npm run test:monitoring
```

## 🔄 Déploiement par Environnement

### Development

```bash
# Démarrage local
npm run dev

# Build de développement
npm run build:dev
```

### Staging

```bash
# Déploiement staging
vercel --target staging

# Build staging
npm run build:staging
```

### Production

```bash
# Déploiement production
vercel --prod

# Build production
npm run build:production
```

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs/concepts/projects/environments)
- [Documentation Supabase](https://supabase.com/docs/guides/getting-started/local-development)
- [Documentation Expo](https://docs.expo.dev/guides/environment-variables/)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
