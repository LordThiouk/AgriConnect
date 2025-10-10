# 🚀 Guide de Déploiement

Guide complet pour déployer AgriConnect en production.

## 🎯 Vue d'ensemble

Ce guide couvre le déploiement de l'application web, mobile et des services backend d'AgriConnect.

## 📋 Prérequis

### Comptes requis
- **Vercel** : Pour l'application web
- **Expo** : Pour l'application mobile
- **Supabase** : Pour le backend
- **Twilio** : Pour les notifications SMS

### Outils requis
- **Git** : Version control
- **Node.js 18+** : Runtime JavaScript
- **npm** : Gestionnaire de paquets
- **Vercel CLI** : `npm install -g vercel`
- **Expo CLI** : `npm install -g @expo/cli`
- **Supabase CLI** : `npm install -g supabase`

## 🔧 Configuration des Environnements

### Variables d'environnement

```bash
# Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

### Configuration Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

## 🌐 Déploiement Web

### 1. Build de Production

```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier le build
npm run preview
```

### 2. Déploiement sur Vercel

```bash
# Connexion à Vercel
vercel login

# Déploiement
vercel --prod

# Configuration des variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### 3. Configuration du Domaine

```bash
# Ajouter un domaine personnalisé
vercel domains add agriconnect.sn

# Configuration DNS
# A record: @ -> 76.76.19.19
# CNAME: www -> cname.vercel-dns.com
```

## 📱 Déploiement Mobile

### 1. Configuration EAS

```bash
# Installation d'EAS CLI
npm install -g eas-cli

# Connexion à Expo
eas login

# Configuration du projet
eas build:configure
```

### 2. Configuration EAS Build

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

### 3. Build de Production

```bash
# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Build pour les deux plateformes
eas build --platform all --profile production
```

### 4. Distribution

```bash
# Distribution via Expo
eas submit --platform android
eas submit --platform ios

# Ou téléchargement direct
# Les APK/IPA sont disponibles dans le dashboard Expo
```

## 🗄️ Déploiement Backend

### 1. Configuration Supabase

```bash
# Connexion à Supabase
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Vérifier la configuration
supabase status
```

### 2. Déploiement des Migrations

```bash
# Appliquer les migrations
supabase db push

# Vérifier les migrations
supabase migration list
```

### 3. Déploiement des Edge Functions

```bash
# Déployer toutes les fonctions
supabase functions deploy

# Déployer une fonction spécifique
supabase functions deploy send-notification

# Vérifier les fonctions
supabase functions list
```

### 4. Configuration des Secrets

```bash
# Ajouter les secrets
supabase secrets set TWILIO_ACCOUNT_SID=your-twilio-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-twilio-token
supabase secrets set TWILIO_PHONE_NUMBER=your-twilio-phone
```

## 🔔 Configuration des Notifications

### 1. Configuration Twilio

```typescript
// Vérification de la configuration
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Test d'envoi
client.messages.create({
  body: 'Test de configuration AgriConnect',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+221701234567'
}).then(message => {
  console.log('SMS envoyé:', message.sid);
});
```

### 2. Configuration des Notifications Push

```typescript
// Configuration Expo Push
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

// Envoi de notification
const sendPushNotification = async (token: string, title: string, body: string) => {
  const message = {
    to: token,
    sound: 'default',
    title,
    body
  };
  
  const chunks = expo.chunkPushNotifications([message]);
  
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Notifications envoyées:', receipts);
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  }
};
```

## 🔒 Configuration de la Sécurité

### 1. Configuration RLS

```sql
-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('producers', 'plots', 'crops', 'operations');

-- Activer RLS sur toutes les tables
ALTER TABLE producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
```

### 2. Configuration des CORS

```typescript
// Configuration CORS pour Supabase
const corsOptions = {
  origin: [
    'https://agriconnect.vercel.app',
    'https://agriconnect.sn',
    'exp://192.168.1.100: 8081' // Pour le développement mobile
  ],
  credentials: true
};
```

### 3. Configuration des Headers de Sécurité

```typescript
// Headers de sécurité pour Vercel
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

## 📊 Monitoring et Logs

### 1. Configuration des Logs

```typescript
// Configuration des logs
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};
```

### 2. Monitoring des Performances

```typescript
// Configuration Sentry
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

### 3. Health Checks

```typescript
// Endpoint de santé
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    await supabase.from('producers').select('count').limit(1);
    
    // Vérifier Twilio
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        twilio: 'ok'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 🧪 Tests de Déploiement

### 1. Tests de Santé

```bash
# Test de l'application web
curl https://agriconnect.vercel.app/health

# Test de l'API
curl https://your-project.supabase.co/rest/v1/producers

# Test des Edge Functions
curl https://your-project.supabase.co/functions/v1/send-notification
```

### 2. Tests Fonctionnels

```typescript
// Tests de déploiement
describe('Deployment Tests', () => {
  it('should be accessible', async () => {
    const response = await fetch('https://agriconnect.vercel.app');
    expect(response.status).toBe(200);
  });
  
  it('should have working API', async () => {
    const response = await fetch('https://your-project.supabase.co/rest/v1/producers');
    expect(response.status).toBe(200);
  });
});
```

## 🔄 CI/CD

### 1. Configuration GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. Déploiement Automatique

```bash
# Configuration des secrets GitHub
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
```

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Twilio](https://www.twilio.com/docs)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
