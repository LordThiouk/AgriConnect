# 🔧 Guide de Configuration Twilio - AgriConnect

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer Twilio avec Supabase pour l'authentification OTP SMS dans l'application mobile AgriConnect.

## 🚨 Problème actuel

- **Erreur Twilio 20003** : "Authenticate" - Credentials Twilio manquants/incorrects
- **Format de numéro** : `2210951543` au lieu de `+221770951543`
- **Mode test forcé** : Le code force l'utilisation du service de test

## 🛠️ Solution étape par étape

### **Étape 1: Configuration Twilio Trial**

1. **Créez un compte Twilio** : https://www.twilio.com/try-twilio
2. **Vérifiez votre numéro** : Twilio vous donnera un numéro de téléphone
3. **Récupérez vos credentials** :
   - Account SID (commence par `AC`)
   - Auth Token (chaîne de caractères)
   - Numéro de téléphone (format E.164, ex: `+1234567890`)

### **Étape 2: Configuration Supabase Dashboard**

1. **Allez dans Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** : `swggnqbymblnyjcocqxi`
3. **Allez dans** : `Settings` → `Authentication` → `Phone Auth`
4. **Activez** : `Enable phone confirmations`
5. **Configurez Twilio** :
   - **Account SID** : Votre Account SID Twilio
   - **Auth Token** : Votre Auth Token Twilio
   - **From Number** : Votre numéro Twilio (format E.164)

### **Étape 3: Configuration des variables d'environnement**

#### **Fichier : `mobile/.env`**
```bash
# Configuration Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_SUPABASE_PROJECT_ID=swggnqbymblnyjcocqxi

# Mode test (true = utilise le service de test, false = utilise Twilio)
EXPO_PUBLIC_FORCE_TEST_MODE=false

# Configuration de développement
NODE_ENV=development
```

### **Étape 4 : Test de la configuration**

1. **Démarrez l'application mobile** :
   ```bash
   cd mobile
   npm start
   ```

2. **Testez l'authentification** :
   - Entrez un numéro de téléphone sénégalais
   - Vérifiez que l'OTP est envoyé via Twilio
   - Vérifiez que le rôle utilisateur est récupéré

## 🔍 Dépannage

### **Erreur 20003 "Authenticate"**
- **Cause** : Credentials Twilio incorrects ou manquants
- **Solution** : Vérifiez les credentials dans Supabase Dashboard

### **Format de numéro incorrect**
- **Cause** : Numéro non normalisé au format E.164
- **Solution** : Le code normalise automatiquement les numéros

### **Mode test toujours activé**
- **Cause** : Variable `EXPO_PUBLIC_FORCE_TEST_MODE=true`
- **Solution** : Changez en `false` dans `mobile/.env`

## 📱 Format des numéros de téléphone

### **Format E.164 requis**
- ✅ **Correct** : `+221770951543`
- ❌ **Incorrect** : `221770951543`, `0770951543`, `2210951543`

### **Normalisation automatique**
Le code normalise automatiquement :
- `221770951543` → `+221770951543`
- `0770951543` → `+221770951543`
- `770951543` → `+221770951543`

## 🧪 Mode test vs Production

### **Mode test (développement)**
```bash
EXPO_PUBLIC_FORCE_TEST_MODE=true
```
- Utilise le service de test local
- Pas d'envoi SMS réel
- Code OTP fixe : `123456`

### **Mode production (Twilio)**
```bash
EXPO_PUBLIC_FORCE_TEST_MODE=false
```
- Utilise Twilio pour l'envoi SMS
- Envoi SMS réel
- Code OTP généré par Twilio

## 🔧 Script de configuration

Utilisez le script de configuration :
```bash
node scripts/setup-twilio-config.js
```

## ✅ Vérification de la configuration

### **Vérifier Supabase Dashboard**
1. Allez dans `Settings` → `Authentication` → `Phone Auth`
2. Vérifiez que Twilio est configuré
3. Testez l'envoi d'un OTP

### **Vérifier les logs**
```bash
# Dans les logs de l'application mobile
LOG  📱 [AUTH] normalizePhoneNumber - Original: 221770951543 Normalisé: +221770951543
LOG  ✅ [AUTH] sendOtpSms - OTP envoyé avec succès
```

## 🚀 Prochaines étapes

1. **Configurez Twilio** dans Supabase Dashboard
2. **Désactivez le mode test** : `EXPO_PUBLIC_FORCE_TEST_MODE=false`
3. **Testez l'authentification** avec un numéro réel
4. **Vérifiez la récupération du rôle** utilisateur
5. **Testez la redirection** vers le bon dashboard

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'application
2. Vérifiez la configuration Supabase
3. Vérifiez les credentials Twilio
4. Consultez la documentation Twilio : https://www.twilio.com/docs/errors/20003
