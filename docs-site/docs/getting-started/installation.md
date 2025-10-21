# Installation

Guide d'installation et de configuration d'AgriConnect.

## Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase
- Compte Twilio (pour les SMS)

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/agriconnect/agriconnect.git
cd agriconnect
```

### 2. Installer les dépendances

```bash
# Application mobile
cd mobile
npm install

# Application web
cd ../web
npm install

# Documentation
cd ../docs-site
npm install
```

### 3. Configuration des variables d'environnement

Copiez les fichiers d'exemple et configurez vos variables :

```bash
# Mobile
cp mobile/env.example mobile/.env

# Web
cp web/.env.example web/.env.local
```

### 4. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez les migrations SQL
3. Configurez l'authentification
4. Activez les Edge Functions

### 5. Configuration Twilio

1. Créez un compte sur [twilio.com](https://twilio.com)
2. Obtenez vos clés API
3. Configurez les variables d'environnement

## Démarrage

### Application Mobile
```bash
cd mobile
npm start
```

### Application Web
```bash
cd web
npm run dev
```

### Documentation
```bash
cd docs-site
npm start
```

## Vérification

1. **Mobile** : http://localhost:8081
2. **Web** : http://localhost:3000
3. **Documentation** : http://localhost:3000

---

Pour plus de détails, consultez les sections spécifiques de cette documentation.
