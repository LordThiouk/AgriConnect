# Security Guidelines - AgriConnect

## 🔒 **Sécurité des Données et Protection des Informations Sensibles**

### **Principe Fondamental**
AgriConnect suit le principe de **"Security by Design"** - la sécurité est intégrée dès la conception et maintenue à chaque étape du développement.

---

## 🚨 **Informations Sensibles à Protéger**

### **1. Clés d'API et Tokens**
- **Supabase Service Role Key** : Accès administrateur complet à la base de données
- **Supabase Anon Key** : Clé publique pour l'authentification
- **JWT Tokens** : Jetons d'authentification des utilisateurs
- **Clés Twilio** : Pour l'envoi de SMS (futur)

### **2. URLs et Références de Projet**
- **URLs Supabase** : `https://xxx.supabase.co`
- **Project References** : Identifiants uniques des projets
- **Endpoints API** : URLs des fonctions Edge

### **3. Données de Test**
- **Emails de test** : `test@agriconnect.sn`
- **Mots de passe de test** : `test123`
- **Numéros de téléphone de test** : `+221701234567`

---

## 🛡️ **Mesures de Protection Implémentées**

### **1. Hook Pre-commit Automatique**
```bash
# Vérifications automatiques avant chaque commit
- Détection d'URLs hardcodées
- Détection de clés API hardcodées
- Détection de tokens JWT hardcodés
- Prévention de commit de fichiers .env
- Vérification des données de test sensibles
```

### **2. Variables d'Environnement**
```bash
# Structure des fichiers .env
.env                    # Variables globales
web/.env               # Variables de l'app web
mobile/.env            # Variables de l'app mobile
supabase/.env.local    # Variables Supabase
tests/.env             # Variables de test
```

### **3. .gitignore Sécurisé**
```gitignore
# Fichiers exclus du versioning
.env
.env.local
.env.*.local
*.key
*.pem
secrets/
```

---

## 🔧 **Configuration des Variables d'Environnement**

### **Variables Requises**
```bash
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
API_BASE_URL=https://your-project-ref.supabase.co/functions/v1

# Test (développement uniquement)
TEST_EMAIL=test@agriconnect.sn
TEST_PASSWORD=test123
TEST_PHONE=+221701234567
```

### **Script de Configuration**
```bash
# Vérification automatique de la configuration
npm run setup:env
```

---

## 🚫 **Pratiques Interdites**

### **1. Hardcoding des Informations Sensibles**
```typescript
// ❌ INTERDIT - Hardcoding d'URL
const API_URL = 'https://swggnqbymblnyjcocqxi.supabase.co/functions/v1';

// ✅ AUTORISÉ - Variable d'environnement
const API_URL = process.env.API_BASE_URL;
```

### **2. Commit de Fichiers .env**
```bash
# ❌ INTERDIT
git add .env
git commit -m "Add environment variables"

# ✅ AUTORISÉ
git add .env.example
git commit -m "Add environment template"
```

### **3. Stockage de Clés dans le Code**
```typescript
// ❌ INTERDIT - Clé dans le code
const serviceKey = 'sk-1234567890abcdef';

// ✅ AUTORISÉ - Clé dans l'environnement
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

---

## 🔍 **Vérifications de Sécurité**

### **1. Avant Chaque Commit**
Le hook pre-commit vérifie automatiquement :
- ✅ Absence d'URLs hardcodées
- ✅ Absence de clés API hardcodées
- ✅ Absence de tokens JWT hardcodés
- ✅ Absence de fichiers .env dans le staging
- ✅ Utilisation de variables d'environnement

### **2. Vérifications Manuelles**
```bash
# Recherche d'informations sensibles
grep -r "swggnqbymblnyjcocqxi" .
grep -r "eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*" .
grep -r "sk-[A-Za-z0-9_-]*" .
```

---

## 🚨 **Procédure en Cas de Fuite**

### **1. Détection Immédiate**
1. **Arrêter le commit** si le hook pre-commit échoue
2. **Identifier le fichier** contenant l'information sensible
3. **Remplacer par une variable d'environnement**

### **2. Correction**
```bash
# 1. Modifier le fichier
# 2. Remplacer la valeur hardcodée par une variable
# 3. Ajouter la variable dans le fichier .env approprié
# 4. Tester la correction
# 5. Commiter la correction
```

### **3. Vérification**
```bash
# Relancer le hook pre-commit
git add .
git commit -m "Fix security issue"
```

---

## 📚 **Documentation et Formation**

### **1. Ressources de Référence**
- **README.md** : Documentation générale du projet
- **tests/README.md** : Guide des tests et configuration
- **scripts/setup-env.js** : Script de configuration automatique

### **2. Formation de l'Équipe**
- **Présentation des risques** de sécurité
- **Formation aux bonnes pratiques** de développement
- **Procédures d'urgence** en cas de fuite

---

## 🔮 **Évolutions Futures**

### **1. Intégration Continue**
- **GitHub Actions** : Vérifications automatiques sur chaque PR
- **SonarQube** : Analyse statique du code
- **Dependabot** : Mise à jour automatique des dépendances

### **2. Monitoring de Sécurité**
- **Alertes automatiques** en cas de détection de données sensibles
- **Audit trail** des modifications de sécurité
- **Rapports de conformité** réguliers

---

## 📞 **Contact Sécurité**

### **Responsable Sécurité**
- **Équipe** : AgriConnect Security Team
- **Email** : security@agriconnect.sn
- **Urgence** : En cas de fuite de données, contacter immédiatement

---

**Dernière mise à jour** : 18 Août 2025  
**Version** : 1.0.0  
**Maintenu par** : Équipe Sécurité AgriConnect
