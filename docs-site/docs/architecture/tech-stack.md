# 🛠️ Stack Technique

Détail complet des technologies utilisées dans AgriConnect.

## 🎯 Vue d'ensemble

AgriConnect utilise un stack moderne et performant, optimisé pour le développement mobile et web avec une architecture serverless.

## 📱 Frontend Mobile

### React Native + Expo

```json
{
  "expo": "~53.0.0",
  "react": "19.1.0",
  "react-native": "0.76.3"
}
```

**Avantages :**
- Développement cross-platform (iOS/Android)
- Hot reload et debugging avancé
- Accès aux APIs natives
- Déploiement simplifié

**Composants clés :**
- **Navigation** : Expo Router (file-based routing)
- **UI** : NativeBase + composants personnalisés
- **State** : Context API + Zustand
- **Offline** : SQLite + AsyncStorage

### Packages essentiels

```json
{
  "@supabase/supabase-js": "^2.56.1",
  "react-native-maps": "^1.18.0",
  "expo-location": "~18.0.0",
  "expo-camera": "~16.0.0",
  "expo-image-picker": "~16.0.0",
  "react-native-phone-number-input": "^2.1.0"
}
```

## 🌐 Frontend Web

### React 19 + Vite

```json
{
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "vite": "^6.0.0",
  "typescript": "^5.6.0"
}
```

**Avantages :**
- Performance optimale avec Vite
- React 19 avec les dernières fonctionnalités
- TypeScript pour la sécurité des types
- Build rapide et HMR

**Composants clés :**
- **Routing** : React Router v6
- **UI** : Tailwind CSS + Headless UI
- **State** : Zustand + React Query
- **Charts** : Recharts

### Packages essentiels

```json
{
  "@supabase/supabase-js": "^2.56.1",
  "react-router-dom": "^6.28.0",
  "tailwindcss": "^3.4.0",
  "@headlessui/react": "^2.2.0",
  "recharts": "^2.12.0",
  "react-query": "^3.39.0"
}
```

## 🗄️ Backend

### Supabase

**PostgreSQL + PostGIS**
```sql
-- Version PostgreSQL
SELECT version();
-- PostgreSQL 15.4 on x86_64-pc-linux-gnu

-- Extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Fonctionnalités :**
- Base de données relationnelle avec support spatial
- API REST auto-générée
- Authentification intégrée
- Row Level Security (RLS)
- Edge Functions (Deno)

### Edge Functions

```typescript
// Runtime : Deno
// Langage : TypeScript natif
// Déploiement : supabase functions deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { phone, message } = await req.json()
  
  // Logique métier
  const result = await processNotification(phone, message)
  
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
})
```

## 🔒 Authentification

### Supabase Auth

```typescript
// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Authentification OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+221701234567',
  options: {
    channel: 'sms'
  }
})
```

**Fonctionnalités :**
- OTP par SMS (Twilio)
- JWT tokens avec expiration
- Gestion des sessions
- Multi-factor authentication (futur)

## 📊 Base de Données

### PostgreSQL 15

**Tables principales :**
```sql
-- Structure simplifiée
cooperatives     (id, name, region, department, commune)
producers        (id, name, phone, cooperative_id)
plots           (id, producer_id, area_ha, soil_type, geom)
crops           (id, plot_id, crop_type, variety, sowing_date)
operations      (id, crop_id, operation_type, date, notes)
observations    (id, crop_id, observation_type, severity, photos)
recommendations (id, crop_id, rule_id, message, status)
```

### PostGIS

**Géométries supportées :**
```sql
-- Points (parcelles)
geom geometry(Point, 4326)

-- Polygones (zones)
geom geometry(Polygon, 4326)

-- Requêtes spatiales
SELECT * FROM plots 
WHERE ST_DWithin(geom, ST_Point(-16.2518, 14.6928), 1000);
```

## 🔔 Notifications

### Twilio SMS

```typescript
// Configuration
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Envoi SMS
await client.messages.create({
  body: 'Votre culture de mil nécessite un arrosage',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+221701234567'
})
```

### Expo Push Notifications

```typescript
// Configuration
import * as Notifications from 'expo-notifications'

// Envoi push
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Alerte agricole',
    body: 'Action requise sur votre parcelle',
  },
  trigger: null, // Immédiat
})
```

## 🗂️ Stockage

### Supabase Storage

```typescript
// Upload de fichiers
const { data, error } = await supabase.storage
  .from('photos')
  .upload('parcelle-123.jpg', file)

// URLs signées
const { data } = supabase.storage
  .from('photos')
  .getPublicUrl('parcelle-123.jpg')
```

**Types de fichiers :**
- Photos de parcelles (JPEG, PNG)
- Documents PDF
- Fichiers de configuration

## 🧪 Tests

### Jest + React Testing Library

```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/react-native": "^12.0.0"
}
```

**Configuration :**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
}
```

## 🚀 Déploiement

### CI/CD avec GitHub Actions

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
      - run: npm run build:all
      - run: npm run deploy:functions
```

### Hébergement

- **Web** : Vercel (automatic deployments)
- **Mobile** : Expo Application Services (EAS)
- **Backend** : Supabase (managed)
- **CDN** : Vercel Edge Network

## 📊 Monitoring

### Métriques de performance

```typescript
// Configuration Sentry
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

**Métriques surveillées :**
- Temps de réponse API
- Taux d'erreur
- Performance mobile
- Utilisation des ressources

## 🔧 Outils de développement

### Linting et Formatting

```json
{
  "eslint": "^8.57.0",
  "prettier": "^3.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0"
}
```

### Git Hooks

```json
{
  "husky": "^8.0.3",
  "lint-staged": "^15.0.0"
}
```

## 📚 Ressources

- [Documentation React Native](https://reactnative.dev/)
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation PostGIS](https://postgis.net/documentation/)
- [Documentation Twilio](https://www.twilio.com/docs)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
