# Configuration Supabase Auth - AgriConnect

## Vue d'ensemble

Ce document détaille la configuration complète de Supabase Auth pour implémenter la stratégie d'authentification duale d'AgriConnect :

- **Mobile** : OTP SMS via Twilio (Agents et Producteurs)
- **Web** : Email/Password via SMTP (Admins et Superviseurs)

## 1. Configuration du projet Supabase

### 1.1 Création du projet

1. Accédez à [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et les clés API :
   - **Project URL** : `https://[project-id].supabase.co`
   - **Anon Key** : Clé publique pour le frontend
   - **Service Role Key** : Clé privée pour les Edge Functions

### 1.2 Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Supabase Configuration
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Twilio Configuration (OTP SMS)
TWILIO_ACCOUNT_SID=[your-account-sid]
TWILIO_AUTH_TOKEN=[your-auth-token]
TWILIO_MESSAGE_SERVICE_SID=[your-message-service-sid]
TWILIO_PHONE_NUMBER=[your-twilio-phone-number]

# SMTP Configuration (Email/Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[your-email@gmail.com]
SMTP_PASS=[your-app-password]
SMTP_FROM=admin@agriconnect.sn

# Application Configuration
NODE_ENV=development
PORT=3000
```

## 2. Configuration OTP SMS avec Twilio

### 2.1 Création du compte Twilio

1. Inscrivez-vous sur [twilio.com](https://twilio.com)
2. Vérifiez votre numéro de téléphone
3. Obtenez vos identifiants :
   - **Account SID**
   - **Auth Token**
   - **Message Service SID** (créez-en un)

### 2.2 Configuration du numéro de téléphone

1. Achetez un numéro de téléphone dans votre région (Sénégal)
2. Activez les capacités SMS
3. Configurez le webhook pour les notifications

### 2.3 Configuration Supabase Dashboard

#### 2.3.1 Activation du provider Phone

1. Allez dans **Authentication** → **Providers**
2. Activez **Phone**
3. Configurez les paramètres :

```json
{
  "enabled": true,
  "provider": "twilio",
  "message_template": "Votre code de vérification AgriConnect est : {{ .Code }}",
  "message_template_id": "your-twilio-template-id",
  "should_create_user": false,
  "confirm_phone_change": true,
  "max_phone_number_change_period": 3600
}
```

#### 2.3.2 Configuration Twilio

```json
{
  "account_sid": "{{ .Env.TWILIO_ACCOUNT_SID }}",
  "auth_token": "{{ .Env.TWILIO_AUTH_TOKEN }}",
  "message_service_sid": "{{ .Env.TWILIO_MESSAGE_SERVICE_SID }}",
  "from_phone_number": "{{ .Env.TWILIO_PHONE_NUMBER }}"
}
```

#### 2.3.3 Paramètres OTP

```json
{
  "otp_length": 6,
  "otp_expiry": 300,
  "rate_limit": {
    "max_attempts": 5,
    "window": 900
  }
}
```

## 3. Configuration Email/Password avec SMTP

### 3.1 Configuration SMTP

#### 3.1.1 Gmail (recommandé pour le développement)

1. Activez l'authentification à 2 facteurs
2. Générez un mot de passe d'application
3. Utilisez ces paramètres :

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "user": "[your-email@gmail.com]",
  "pass": "[your-app-password]",
  "from": "admin@agriconnect.sn",
  "secure": false,
  "require_tls": true
}
```

#### 3.1.2 Autres fournisseurs SMTP

**SendGrid :**
```json
{
  "host": "smtp.sendgrid.net",
  "port": 587,
  "user": "apikey",
  "pass": "[your-sendgrid-api-key]"
}
```

**Mailgun :**
```json
{
  "host": "smtp.mailgun.org",
  "port": 587,
  "user": "[your-mailgun-username]",
  "pass": "[your-mailgun-password]"
}
```

### 3.2 Configuration Supabase Dashboard

#### 3.2.1 Activation du provider Email

1. Allez dans **Authentication** → **Providers**
2. Activez **Email**
3. Configurez les paramètres :

```json
{
  "enabled": true,
  "double_confirm_changes": true,
  "enable_signup": false,
  "confirm_email_change": true,
  "secure_email_change_enabled": true,
  "mailer_autoconfirm": false
}
```

#### 3.2.2 Configuration SMTP

```json
{
  "host": "{{ .Env.SMTP_HOST }}",
  "port": "{{ .Env.SMTP_PORT }}",
  "user": "{{ .Env.SMTP_USER }}",
  "pass": "{{ .Env.SMTP_PASS }}",
  "from": "{{ .Env.SMTP_FROM }}",
  "secure": false,
  "require_tls": true
}
```

## 4. Configuration des rôles et permissions

### 4.1 Rôles utilisateur

Créez les rôles suivants dans Supabase :

```sql
-- Rôles pour l'application
CREATE TYPE user_role AS ENUM (
  'agent',
  'producer', 
  'supervisor',
  'admin'
);

-- Rôles pour les plateformes
CREATE TYPE platform_type AS ENUM (
  'mobile',
  'web'
);

-- Rôles pour les méthodes d'authentification
CREATE TYPE auth_method AS ENUM (
  'otp_sms',
  'email_password'
);
```

### 4.2 Politiques RLS (Row Level Security)

#### 4.2.1 Table profiles

```sql
-- Politique : Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique : Les admins peuvent lire tous les profils
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND user_metadata->>'role' = 'admin'
    )
  );

-- Politique : Les superviseurs peuvent lire les profils de leur coopérative
CREATE POLICY "Supervisors can view cooperative profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN memberships m ON u.id = m.profile_id
      WHERE u.id = auth.uid() 
      AND u.user_metadata->>'role' = 'supervisor'
      AND m.coop_id IN (
        SELECT coop_id FROM memberships 
        WHERE profile_id = profiles.id
      )
    )
  );
```

#### 4.2.2 Table auth_logs

```sql
-- Politique : Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view own auth logs" ON auth_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : Les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all auth logs" ON auth_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND user_metadata->>'role' = 'admin'
    )
  );
```

## 5. Configuration des Edge Functions

### 5.1 Fonction de validation des plateformes

Créez `supabase/functions/validate-platform/index.ts` :

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, platform, role } = await req.json();
    
    // Validation de la plateforme selon le rôle
    const allowedPlatforms = {
      'agent': ['mobile'],
      'producer': ['mobile'],
      'supervisor': ['web'],
      'admin': ['web']
    };

    const isAllowed = allowedPlatforms[role]?.includes(platform);
    
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ 
          error: `Accès ${platform} non autorisé pour le rôle ${role}` 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true, platform, role }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### 5.2 Fonction de journalisation des événements

Créez `supabase/functions/log-auth-event/index.ts` :

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_type, platform, auth_method, user_role, success, metadata } = await req.json();
    
    const { data, error } = await supabase
      .from('auth_logs')
      .insert({
        event_type,
        platform,
        auth_method,
        user_role,
        success,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, log_id: data.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## 6. Tests de configuration

### 6.1 Test OTP SMS

1. **Test d'envoi :**
   ```bash
   curl -X POST "https://[project-id].supabase.co/auth/v1/otp" \
     -H "apikey: [your-anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"phone": "+221701234567"}'
   ```

2. **Test de vérification :**
   ```bash
   curl -X POST "https://[project-id].supabase.co/auth/v1/verify" \
     -H "apikey: [your-anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"phone": "+221701234567", "token": "123456", "type": "sms"}'
   ```

### 6.2 Test Email/Password

1. **Test de connexion :**
   ```bash
   curl -X POST "https://[project-id].supabase.co/auth/v1/token?grant_type=password" \
     -H "apikey: [your-anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@agriconnect.sn", "password": "SecurePass123!"}'
   ```

2. **Test de réinitialisation de mot de passe :**
   ```bash
   curl -X POST "https://[project-id].supabase.co/auth/v1/recover" \
     -H "apikey: [your-anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@agriconnect.sn"}'
   ```

## 7. Monitoring et maintenance

### 7.1 Logs d'authentification

1. **Vue des logs en temps réel :**
   ```sql
   SELECT * FROM auth_logs 
   WHERE created_at >= NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

2. **Statistiques des événements :**
   ```sql
   SELECT 
     event_type,
     platform,
     COUNT(*) as event_count,
     COUNT(*) FILTER (WHERE success = true) as success_count
   FROM auth_logs 
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY event_type, platform;
   ```

### 7.2 Nettoyage automatique

Configurez un cron job pour nettoyer les anciens logs :

```sql
-- Exécuter tous les jours à 2h du matin
SELECT cron.schedule(
  'cleanup-auth-logs',
  '0 2 * * *',
  'SELECT cleanup_old_auth_logs(90);'
);
```

### 7.3 Alertes de sécurité

1. **Tentatives d'authentification échouées :**
   ```sql
   SELECT * FROM security_alerts 
   WHERE event_type = 'login_failure' 
   AND created_at >= NOW() - INTERVAL '1 hour';
   ```

2. **Activités suspectes :**
   ```sql
   SELECT * FROM security_alerts 
   WHERE event_type IN ('suspicious_activity', 'rate_limit_exceeded')
   AND created_at >= NOW() - INTERVAL '24 hours';
   ```

## 8. Dépannage

### 8.1 Problèmes OTP SMS

- **OTP non reçu :** Vérifiez la configuration Twilio et les quotas
- **Erreur de vérification :** Vérifiez l'expiration et la validité du code
- **Limite de taux dépassée :** Ajustez les paramètres de rate limiting

### 8.2 Problèmes Email/Password

- **Email non envoyé :** Vérifiez la configuration SMTP et les credentials
- **Erreur d'authentification :** Vérifiez les politiques RLS et les permissions
- **Problème de session :** Vérifiez la configuration JWT et l'expiration

### 8.3 Problèmes de plateforme

- **Accès refusé :** Vérifiez la validation des rôles et des plateformes
- **Erreur de middleware :** Vérifiez la configuration des Edge Functions
- **Problème de permissions :** Vérifiez les politiques RLS et les rôles

## 9. Sécurité et bonnes pratiques

### 9.1 Sécurité des clés

- Stockez les clés sensibles dans les variables d'environnement
- Utilisez des clés différentes pour le développement et la production
- Rotez régulièrement les clés d'API

### 9.2 Validation des entrées

- Validez tous les numéros de téléphone (format E.164)
- Validez les emails et mots de passe côté serveur
- Implémentez des limites de taux pour prévenir les abus

### 9.3 Monitoring

- Surveillez les tentatives d'authentification échouées
- Alertez sur les activités suspectes
- Maintenez des logs d'audit complets

## 10. Support et ressources

### 10.1 Documentation officielle

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### 10.2 Communauté

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### 10.3 Contact AgriConnect

Pour toute question spécifique au projet AgriConnect :
- **Email** : support@agriconnect.sn
- **Documentation** : [docs.agriconnect.sn](https://docs.agriconnect.sn)
- **GitHub** : [github.com/agriconnect](https://github.com/agriconnect)
