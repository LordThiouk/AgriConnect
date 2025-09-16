# Guide de Déploiement AgriConnect

## 🚀 Déploiement Mobile (EAS) + Web (Vercel)

Ce guide vous accompagne dans le déploiement de l'application AgriConnect sur les plateformes mobiles et web.

---

## 📱 **1. Déploiement Mobile avec EAS**

### **Prérequis**
- Compte Expo développeur
- Comptes Google Play Console et Apple Developer
- Node.js et npm installés

### **Installation EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### **Configuration Initiale**
```bash
# Se connecter à Expo
eas login

# Initialiser EAS dans le projet mobile
cd mobile
eas init

# Configurer le projet (remplacer your-project-id-here dans app.config.js)
eas project:init
```

### **Configuration des Variables d'Environnement**
1. Copier `mobile/env.production.example` vers `mobile/.env.production`
2. Remplir les variables avec vos clés de production :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_TWILIO_ACCOUNT_SID`
   - `EXPO_PUBLIC_TWILIO_AUTH_TOKEN`
   - `EXPO_PUBLIC_TWILIO_PHONE_NUMBER`

### **Build et Déploiement**
```bash
# Build de développement (test local)
eas build --platform all --profile development

# Build de preview (test interne)
eas build --platform all --profile preview

# Build de production
eas build --platform all --profile production

# Soumission aux stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### **Configuration des Stores**

#### **Android (Google Play)**
1. Créer un compte Google Play Console
2. Télécharger le fichier `google-service-account.json`
3. Le placer dans `mobile/google-service-account.json`
4. Mettre à jour `eas.json` avec les bonnes informations

#### **iOS (App Store)**
1. Créer un compte Apple Developer
2. Mettre à jour `eas.json` avec :
   - `appleId` : Votre Apple ID
   - `ascAppId` : ID de l'application
   - `appleTeamId` : ID de l'équipe

---

## 🌐 **2. Déploiement Web avec Vercel**

### **Prérequis**
- Compte Vercel
- Node.js et npm installés

### **Installation Vercel CLI**
```bash
npm install -g vercel
```

### **Configuration Initiale**
```bash
# Se connecter à Vercel
vercel login

# Initialiser le projet web
cd web
vercel init
```

### **Configuration des Variables d'Environnement**
1. Copier `web/env.production.example` vers `web/.env.production`
2. Remplir les variables avec vos clés de production
3. Configurer les variables dans Vercel :
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

### **Build et Déploiement**
```bash
# Build local de test
npm run build

# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

---

## 🔧 **3. Configuration de Production**

### **Variables d'Environnement Requises**

#### **Mobile (.env.production)**
```env
EXPO_PUBLIC_SUPABASE_URL=https://swggnqbymblnyjcocqxi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your-twilio-account-sid
EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your-twilio-auth-token
EXPO_PUBLIC_TWILIO_PHONE_NUMBER=your-twilio-phone-number
EXPO_PUBLIC_APP_ENV=production
```

#### **Web (.env.production)**
```env
VITE_SUPABASE_URL=https://swggnqbymblnyjcocqxi.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_ENV=production
```

### **Configuration Supabase**
1. **RLS Policies** : Vérifier que toutes les politiques sont activées
2. **Edge Functions** : Déployer les fonctions sur Supabase
3. **Storage** : Configurer les buckets pour les photos
4. **Auth** : Configurer les providers OTP SMS et Email/Password

---

## 🚀 **4. Scripts de Déploiement Automatisé**

### **Déploiement Mobile**
```bash
# Windows (PowerShell)
./scripts/deploy-mobile.sh

# Ou manuellement
cd mobile
eas build --platform all --profile production
eas submit --platform all --profile production
```

### **Déploiement Web**
```bash
# Windows (PowerShell)
./scripts/deploy-web.sh

# Ou manuellement
cd web
vercel --prod
```

---

## 📊 **5. Monitoring et Analytics**

### **EAS Analytics (Mobile)**
- **Performance** : Temps de démarrage, crash reports
- **Usage** : Sessions, utilisateurs actifs
- **Builds** : Statut des builds, logs d'erreurs

### **Vercel Analytics (Web)**
- **Performance** : Core Web Vitals, temps de chargement
- **Usage** : Pages vues, utilisateurs uniques
- **Errors** : Logs d'erreurs, monitoring

### **Supabase Monitoring**
- **Database** : Requêtes, performance, erreurs
- **Auth** : Connexions, échecs d'authentification
- **Storage** : Utilisation, bande passante

---

## 🔒 **6. Sécurité et Conformité**

### **Certificats SSL**
- **Mobile** : Gérés automatiquement par EAS
- **Web** : Gérés automatiquement par Vercel

### **Variables Sensibles**
- **Jamais** commiter les fichiers `.env.production`
- Utiliser les variables d'environnement des plateformes
- Rotation régulière des clés API

### **RLS (Row Level Security)**
- Vérifier que toutes les tables ont des politiques RLS
- Tester les permissions par rôle utilisateur
- Auditer l'accès aux données sensibles

---

## 🎯 **7. Checklist de Déploiement**

### **Avant le Déploiement**
- [ ] Variables d'environnement configurées
- [ ] Tests de l'application en local
- [ ] Configuration des stores (Android/iOS)
- [ ] Vérification des politiques RLS
- [ ] Backup de la base de données

### **Déploiement Mobile**
- [ ] Build de développement réussi
- [ ] Build de preview testé
- [ ] Build de production créé
- [ ] Soumission aux stores effectuée
- [ ] Tests sur appareils réels

### **Déploiement Web**
- [ ] Build local réussi
- [ ] Déploiement preview testé
- [ ] Déploiement production effectué
- [ ] Tests de performance
- [ ] Configuration du domaine personnalisé

### **Après le Déploiement**
- [ ] Monitoring activé
- [ ] Analytics configurées
- [ ] Tests de bout en bout
- [ ] Documentation mise à jour
- [ ] Formation des utilisateurs

---

## 🆘 **8. Dépannage**

### **Erreurs Communes**

#### **EAS Build Fails**
```bash
# Nettoyer le cache
eas build --clear-cache

# Vérifier les logs
eas build:list
eas build:view [BUILD_ID]
```

#### **Vercel Deploy Fails**
```bash
# Vérifier les logs
vercel logs

# Redéployer
vercel --prod --force
```

#### **Supabase Connection Issues**
- Vérifier les variables d'environnement
- Tester la connexion avec Postman
- Vérifier les politiques RLS

### **Support**
- **EAS** : [Expo Documentation](https://docs.expo.dev/)
- **Vercel** : [Vercel Documentation](https://vercel.com/docs)
- **Supabase** : [Supabase Documentation](https://supabase.com/docs)

---

## 📈 **9. Coûts Estimés**

| Service | Coût/Mois | Fonctionnalités |
|---------|-----------|-----------------|
| **Supabase** | $25 | Backend complet |
| **EAS** | $29 | Builds illimités |
| **Vercel** | Gratuit | Web app |
| **Google Play** | $25 (une fois) | Store Android |
| **Apple Developer** | $99/an | Store iOS |
| **Total** | **$54/mois** | **Solution complète** |

---

**🎉 Félicitations ! Votre application AgriConnect est maintenant prête pour la production !**
