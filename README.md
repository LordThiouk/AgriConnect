qui est sur ce local # AgriConnect - Plateforme Numérique Agricole

Une application mobile et web complète pour digitaliser le suivi agricole au Sénégal, connectant les producteurs, agents de terrain et superviseurs.

## 🎯 **Vue d'ensemble**

AgriConnect est une plateforme numérique qui modernise la collecte et le suivi des données agricoles. Elle permet aux agents de terrain de collecter des données sur les producteurs, parcelles et cultures, tout en offrant aux producteurs un suivi de leurs activités agricoles.

### **Fonctionnalités principales**
- 📱 **Application mobile** pour agents de terrain et producteurs
- 🌐 **Interface web** pour superviseurs et administrateurs
- 🗺️ **Cartographie GPS** des parcelles avec PostGIS
- 🔒 **Sécurité avancée** avec Row Level Security (RLS)
- 📊 **Tableaux de bord** et rapports agricoles
- 🔔 **Notifications** SMS et push
- 📸 **Gestion des photos** et documents

## 🏗️ **Architecture**

### **Stack Technique**
- **Frontend Mobile**: React Native (Expo SDK 53)
- **Frontend Web**: React 19 + Vite + TypeScript
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Authentification**: Phone-based OTP
- **Base de données**: PostgreSQL avec PostGIS pour la géolocalisation

### **Structure du Projet**
```
AgriConnect/
├── web/                 # Application web React
├── mobile/             # Application mobile React Native
├── supabase/           # Configuration et migrations DB
├── lib/                # Utilitaires partagés
└── .cursor/            # Documentation et règles projet
```

## 🚀 **Installation et Configuration**

### **Prérequis**
- Node.js 18+
- npm 9+
- Git
- Supabase CLI (`npm install -g supabase`)
- Expo CLI (`npm install -g @expo/cli`)

### **Installation**
```bash
# Cloner le repository
git clone <repository-url>
cd AgriConnect

# Installer toutes les dépendances
npm run install:all

# Configurer les variables d'environnement
cp env.example .env
# Éditer .env avec vos credentials Supabase
```

### **Configuration Supabase**
```bash
# Lier le projet Supabase
npx supabase link --project-ref <your-project-ref>

# Appliquer les migrations
npx supabase db push
```

### **Démarrage du développement**
```bash
# Démarrer les deux applications
npm run dev:all

# Ou démarrer séparément
npm run dev:web      # Application web
npm run dev:mobile   # Application mobile
```

## 📊 **Base de Données**

### **Tables Principales**
- **cooperatives**: Gestion des coopératives agricoles
- **producers**: Informations sur les producteurs
- **plots**: Parcelles agricoles avec géolocalisation
- **crops**: Cultures plantées sur les parcelles
- **operations**: Opérations agricoles (semis, fertilisation, etc.)
- **observations**: Observations terrain et monitoring
- **media**: Photos et documents
- **recommendations**: Recommandations automatisées
- **notifications**: Suivi des communications

### **Sécurité**
- **Row Level Security (RLS)** activé sur toutes les tables
- **Multi-tenant** isolation par coopérative
- **Audit logging** complet des modifications
- **Rôles utilisateurs**: admin, superviseur, agent, producteur

## 🔧 **Développement**

### **Scripts Disponibles**
```bash
# Installation
npm run install:all

# Développement
npm run dev:all
npm run dev:web
npm run dev:mobile

# Base de données
npm run db:migrate
npm run db:reset
npm run supabase:status

# Qualité du code
npm run lint:all
npm run lint:web
npm run lint:mobile

# Build
npm run build:all
npm run build:web
npm run build:mobile
```

### **Variables d'Environnement**
```bash
# Requises
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Optionnelles
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 📱 **Utilisation**

### **Agents de Terrain**
- Collecte de données producteurs et parcelles
- Enregistrement des opérations agricoles
- Observations terrain avec photos
- Synchronisation offline

### **Producteurs**
- Suivi de leurs parcelles et cultures
- Réception de conseils et alertes
- Mise à jour de l'état des cultures

### **Superviseurs/Admins**
- Tableaux de bord et statistiques
- Validation des données collectées
- Gestion des coopératives
- Génération de rapports

## 🔒 **Sécurité**

- **Authentification** par téléphone avec OTP
- **Chiffrement** des données sensibles
- **Audit trail** complet
- **Permissions granulaires** par rôle
- **Validation** des données côté serveur

## 📈 **Performance**

- **Optimisation mobile** pour zones rurales
- **Synchronisation offline** avec queue
- **Indexation** stratégique de la base de données
- **Compression** des images et médias

## 🤝 **Contribution**

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 **Support**

Pour toute question ou support :
- 📧 Email: pirlothiouk@gmail.com

---

**AgriConnect** - Moderniser l'agriculture au Sénégal 🌾
