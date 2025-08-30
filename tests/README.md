# AgriConnect Test Suite

## 📋 Vue d'ensemble

Cette suite de tests couvre l'ensemble du projet AgriConnect, incluant les API, la base de données, les applications mobile et web.

## 🏗️ Structure des Tests

```
tests/
├── api/                    # Tests des API Edge Functions
│   ├── auth.test.js       # Tests d'authentification
│   └── entities.test.js   # Tests des entités agricoles
├── database/              # Tests de la base de données
│   └── schema.test.js     # Validation du schéma et RLS
├── mobile/                # Tests de l'app mobile
│   └── app.test.js        # Tests des fonctionnalités mobile
├── web/                   # Tests de l'app web
│   └── app.test.js        # Tests des fonctionnalités web
├── package.json           # Dépendances et scripts de test
└── README.md              # Cette documentation
```

## 🎯 Types de Tests

### 1. **Tests API** (`tests/api/`)
- **Authentification** : Tests des endpoints auth (mobile: phone+OTP, web: email+password)
- **Entités Agricoles** : Tests CRUD pour producers, plots, crops, operations, observations
- **Sécurité** : Validation des politiques RLS et des permissions

### 2. **Tests Base de Données** (`tests/database/`)
- **Structure** : Validation de l'existence des tables
- **Contraintes** : Tests des clés étrangères et contraintes
- **RLS** : Validation des politiques de sécurité
- **Performance** : Tests des index et requêtes
- **Géospatial** : Validation des fonctionnalités PostGIS

### 3. **Tests Mobile** (`tests/mobile/`)
- **Authentification** : Validation phone+OTP
- **Fonctionnalités Producteur** : Gestion des parcelles, cultures, notifications
- **Fonctionnalités Agent** : Enregistrement producteurs, collecte données, GPS
- **Mode Hors-ligne** : Stockage local, synchronisation, résolution de conflits
- **Interface** : Responsive design, accessibilité, localisation

### 4. **Tests Web** (`tests/web/`)
- **Authentification** : Validation email+password
- **Dashboard** : KPIs, mises à jour temps réel, graphiques interactifs
- **Rapports** : Génération, filtrage, export (CSV/PDF/Excel)
- **Analytics** : Visualisation, analyse des tendances, métriques
- **Gestion Utilisateurs** : Création, rôles, permissions
- **Interface** : Responsive, accessibilité, compatibilité navigateurs

## 🚀 Installation et Configuration

### Prérequis
- Node.js >= 18.0.0
- Accès aux API Supabase
- Variables d'environnement configurées

### Installation
```bash
cd tests
npm install
```

### Configuration des Variables d'Environnement
```bash
# Créer un fichier .env dans le dossier tests/
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📱 Spécificités par Plateforme

### **Application Mobile** (Producteurs & Agents)
- **Authentification** : Numéro de téléphone + OTP
- **Fonctionnalités** : Gestion parcelles, collecte terrain, mode hors-ligne
- **Utilisateurs** : Producteurs agricoles, agents de terrain
- **Contexte** : Zones rurales, connectivité limitée

### **Application Web** (Superviseurs & Admins)
- **Authentification** : Email + mot de passe
- **Fonctionnalités** : Dashboard, rapports, analytics, gestion utilisateurs
- **Utilisateurs** : Superviseurs de coopératives, administrateurs
- **Contexte** : Bureaux, connectivité stable

## 🧪 Exécution des Tests

### Tests Individuels
```bash
# Tests d'authentification uniquement
npm run test:auth

# Tests des entités agricoles
npm run test:entities

# Tests de la base de données
npm run test:database

# Tests de l'app mobile
npm run test:mobile

# Tests de l'app web
npm run test:web
```

### Tests par Catégorie
```bash
# Tous les tests API
npm run test:api

# Tous les tests
npm run test:all
```

### Tests avec Options
```bash
# Tests en production
npm run test:production

# Tests en local
npm run test:local
```

## 📊 Interprétation des Résultats

### Format des Résultats
Chaque test génère un rapport détaillé incluant :
- **Statut** : ✅ Succès ou ❌ Échec
- **Détails** : Description du résultat
- **Timestamp** : Horodatage de l'exécution
- **Résumé** : Statistiques globales (taux de succès, nombre de tests)

### Exemple de Sortie
```
🧪 Running Authentication API Tests...

📱 Testing Mobile App Authentication (Phone + OTP)...
✅ Phone Number Validation: Valid Senegalese phone number
✅ OTP Validation: Valid 6-digit OTP
✅ Role Assignment: Producer role assigned

🌐 Testing Web App Authentication (Email + Password)...
✅ Email Validation: Valid email format
✅ Password Strength: Strong password
✅ Role-Based Access: Admin access granted

📊 Test Results Summary:
========================
Total Tests: 6
Passed: 6
Failed: 0
Success Rate: 100.0%
```

## 🔧 Personnalisation des Tests

### Ajout de Nouveaux Tests
1. Créer un nouveau fichier de test dans le dossier approprié
2. Étendre la classe de test existante ou créer une nouvelle
3. Implémenter les méthodes de test avec `recordTest()`
4. Ajouter les scripts dans `package.json`

### Configuration des Tests
- **Variables d'environnement** : Configurer les URLs et clés API
- **Données de test** : Adapter les données selon l'environnement
- **Assertions** : Personnaliser les critères de validation

## 🚨 Dépannage

### Problèmes Courants
1. **Erreurs de connexion** : Vérifier les variables d'environnement
2. **Tests qui échouent** : Vérifier la disponibilité des services
3. **Timeouts** : Ajuster les délais d'attente si nécessaire

### Logs et Debugging
- Les tests affichent des logs détaillés
- Utiliser `console.log()` pour le debugging
- Vérifier les réponses des API dans les détails des tests

## 📈 Intégration Continue

### GitHub Actions
```yaml
# Exemple d'intégration CI/CD
- name: Run Tests
  run: |
    cd tests
    npm install
    npm run test:all
```

### Tests Automatisés
- Exécution automatique sur chaque commit
- Validation des builds avant déploiement
- Rapports de couverture de tests

## 🤝 Contribution

### Ajout de Tests
1. Identifier la fonctionnalité à tester
2. Créer le test dans le dossier approprié
3. Suivre les conventions de nommage
4. Documenter les nouveaux tests

### Amélioration des Tests
- Optimiser les performances
- Améliorer la couverture
- Ajouter des tests d'intégration
- Implémenter des tests de charge

---

**Dernière mise à jour** : 18 Août 2025  
**Version** : 1.0.0  
**Maintenu par** : Équipe AgriConnect
