# 🗄️ Configuration Supabase

Guide complet pour configurer Supabase pour AgriConnect.

## 📋 Prérequis

- Compte Supabase créé
- Projet Supabase initialisé
- Supabase CLI installé

## 🔧 Configuration du Projet

### 1. Créer un nouveau projet

```bash
# Se connecter à Supabase
npx supabase login

# Créer un nouveau projet
npx supabase projects create agriconnect --region eu-west-1
```

### 2. Lier le projet local

```bash
# Lier le projet
npx supabase link --project-ref <your-project-ref>
```

### 3. Variables d'environnement

```bash
# .env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Base de Données

### Appliquer les migrations

```bash
# Appliquer toutes les migrations
npx supabase db push

# Ou utiliser le script npm
npm run db:migrate
```

### Vérifier la configuration

```bash
# Statut du projet
npx supabase status

# Ouvrir le studio
npx supabase studio
```

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques par rôle :

```sql
-- Exemple pour la table producers
CREATE POLICY "Agents can view producers in their cooperative" ON producers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM memberships 
      WHERE cooperative_id = producers.cooperative_id
    )
  );
```

### Rôles utilisateurs

- `admin` : Accès complet
- `supervisor` : Supervision régionale
- `agent` : Collecte terrain
- `producer` : Consultation données

## 📊 PostGIS

### Extension spatiale

```sql
-- Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Vérifier l'installation
SELECT PostGIS_Version();
```

### Tables géospatiales

- `plots` : Géométries des parcelles
- `cooperatives` : Zones géographiques
- `observations` : Points d'observation

## 🔔 Notifications

### Configuration Twilio

```bash
# Variables d'environnement
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number
```

### Edge Functions

```bash
# Déployer les fonctions
npx supabase functions deploy

# Ou utiliser le script npm
npm run deploy:functions
```

## 🧪 Tests

### Tests de base

```bash
# Tests API
npm run test:api

# Tests base de données
npm run test:database
```

### Vérifications manuelles

1. **Authentification** : Test de connexion OTP
2. **RLS** : Vérification des permissions
3. **PostGIS** : Test des requêtes spatiales
4. **Edge Functions** : Test des notifications

## 🚀 Déploiement

### Environnements

- **Development** : Supabase local
- **Staging** : Projet Supabase staging
- **Production** : Projet Supabase production

### Migration des données

```bash
# Backup de production
npx supabase db dump --data-only > backup.sql

# Restore en staging
npx supabase db reset --db-url <staging-url>
```

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
