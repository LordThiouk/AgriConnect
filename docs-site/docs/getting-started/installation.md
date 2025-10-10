# 🚀 Installation et Configuration

Ce guide vous accompagne dans l'installation complète d'AgriConnect sur votre environnement de développement.

## 📋 Prérequis

### Logiciels requis
- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **npm** 9+ (inclus avec Node.js)
- **Git** ([télécharger](https://git-scm.com/))
- **Supabase CLI** : `npm install -g supabase`
- **Expo CLI** : `npm install -g @expo/cli`

### Comptes requis
- **Supabase** : [Créer un compte](https://supabase.com/)
- **Twilio** (optionnel) : [Créer un compte](https://www.twilio.com/)

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd AgriConnect
```

### 2. Installer les dépendances

```bash
# Installation complète (web + mobile + racine)
npm run install:all
```

### 3. Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer avec vos credentials
# Windows
notepad .env
# macOS/Linux
nano .env
```

### Variables d'environnement requises

```bash
# Supabase (obligatoire)
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio (optionnel pour les notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## 🗄️ Configuration Supabase

### 1. Lier le projet

```bash
# Lier votre projet Supabase
npx supabase link --project-ref <your-project-ref>
```

### 2. Appliquer les migrations

```bash
# Appliquer toutes les migrations
npx supabase db push

# Ou utiliser le script npm
npm run db:migrate
```

### 3. Vérifier la configuration

```bash
# Vérifier le statut
npx supabase status

# Ou utiliser le script npm
npm run supabase:status
```

## 🚀 Démarrage du développement

### Démarrage complet

```bash
# Démarrer web + mobile simultanément
npm run dev:all
```

### Démarrage séparé

```bash
# Application web uniquement
npm run dev:web

# Application mobile uniquement
npm run dev:mobile
```

## 📱 Configuration Mobile

### 1. Installer Expo Go

- **Android** : [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS** : [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Scanner le QR code

Une fois l'application mobile démarrée, scannez le QR code affiché dans le terminal avec Expo Go.

## 🌐 Configuration Web

L'application web sera accessible sur `http://localhost:5173` (ou le port affiché dans le terminal).

## ✅ Vérification de l'installation

### Tests de base

```bash
# Tests API
npm run test:api

# Tests base de données
npm run test:database

# Tests complets
npm run test:all
```

### Vérifications manuelles

1. **Web** : Accéder à `http://localhost:5173`
2. **Mobile** : Scanner le QR code avec Expo Go
3. **Base de données** : Vérifier les tables dans Supabase Studio

## 🐛 Résolution de problèmes

### Problèmes courants

#### Erreur de connexion Supabase
```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Relancer la liaison
npx supabase link --project-ref <your-project-ref>
```

#### Problème de port mobile
```bash
# Nettoyer le cache Expo
npx expo start --clear

# Ou redémarrer avec un port spécifique
npx expo start --port 8081
```

#### Erreur de dépendances
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run install:all
```

## 📚 Prochaines étapes

- [Configuration Supabase](supabase-setup.md)
- [Premiers pas](first-steps.md)
- [Guide de développement](../development/guide.md)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/your-repo/issues)
- Contactez : pirlothiouk@gmail.com
