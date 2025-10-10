# Configuration Twilio pour AgriConnect Mobile

## Vue d'ensemble

Ce guide explique comment configurer Twilio pour l'envoi de SMS OTP dans l'application mobile AgriConnect via Supabase Auth.

## Prérequis

1. Compte Twilio actif
2. Projet Supabase configuré
3. Accès au dashboard Supabase

## Configuration Twilio

### 1. Obtenir les identifiants Twilio

1. Connectez-vous à votre [console Twilio](https://console.twilio.com/)
2. Récupérez vos identifiants :
   - **Account SID** : `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token** : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Phone Number** : `+1234567890` (votre numéro Twilio)

### 2. Configuration dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans **Authentication** > **Settings**
3. Dans la section **Phone Auth**, configurez :
   - **Enable phone confirmations** : ✅ Activé
   - **Phone number** : Votre numéro Twilio
   - **Twilio Account SID** : Votre Account SID
   - **Twilio Auth Token** : Votre Auth Token

### 3. Configuration des templates SMS

#### Template par défaut
```
Votre code de vérification AgriConnect est : {{ .Code }}
```

#### Template personnalisé (recommandé)
```
🌱 AgriConnect - Code de vérification
Votre code : {{ .Code }}
Valide 5 minutes. Ne partagez jamais ce code.
```

### 4. Variables d'environnement

Assurez-vous que vos variables d'environnement pointent vers la production :

```env
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Test de la configuration

### 1. Test via Supabase Dashboard

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user**
3. Sélectionnez **Phone** comme méthode
4. Entrez un numéro de test : `+221701234567`
5. Vérifiez que le SMS est reçu

### 2. Test via l'application mobile

1. Lancez l'application mobile
2. Entrez un numéro de téléphone sénégalais valide
3. Vérifiez que le SMS OTP est reçu
4. Testez la vérification du code

## Dépannage

### Problèmes courants

#### SMS non reçu
- Vérifiez que le numéro est au format international (+221XXXXXXXXX)
- Vérifiez que Twilio est correctement configuré dans Supabase
- Vérifiez les logs dans la console Twilio

#### Erreur "Invalid phone number"
- Assurez-vous que le numéro commence par +221
- Vérifiez que le numéro a 9 chiffres après +221

#### Erreur "SMS sending failed"
- Vérifiez les identifiants Twilio
- Vérifiez que votre compte Twilio a des crédits
- Vérifiez que le numéro Twilio est vérifié

### Logs utiles

Dans la console Twilio, vous pouvez voir :
- Les tentatives d'envoi de SMS
- Les erreurs de livraison
- Les statistiques d'utilisation

## Coûts

- **SMS Sénégal** : ~0.05$ par SMS
- **SMS International** : Variable selon le pays
- **Frais Twilio** : Compte gratuit avec 15$ de crédit

## Sécurité

### Bonnes pratiques

1. **Ne jamais exposer** les identifiants Twilio côté client
2. **Utiliser les variables d'environnement** pour les secrets
3. **Limiter le taux d'envoi** pour éviter le spam
4. **Valider les numéros** avant l'envoi

### Configuration RLS

Assurez-vous que les politiques RLS sont configurées :

```sql
-- Politique pour l'envoi d'OTP
CREATE POLICY "Allow OTP sending" ON auth.users
  FOR INSERT WITH CHECK (true);

-- Politique pour la vérification d'OTP
CREATE POLICY "Allow OTP verification" ON auth.users
  FOR UPDATE USING (true);
```

## Monitoring

### Métriques importantes

1. **Taux de livraison SMS** : >95%
2. **Temps de livraison** : &lt;30 secondes
3. **Taux de conversion OTP** : >80%
4. **Erreurs d'envoi** : &lt;5%

### Alertes recommandées

1. **Taux d'erreur élevé** : >10%
2. **Crédits Twilio faibles** : &lt;10$
3. **Tentatives de spam** : >100 par heure

## Support

- **Documentation Twilio** : https://www.twilio.com/docs
- **Documentation Supabase Auth** : https://supabase.com/docs/guides/auth
- **Support AgriConnect** : [Votre email de support]

---

**Note** : Cette configuration est maintenant active en production. Le mode test a été supprimé.
