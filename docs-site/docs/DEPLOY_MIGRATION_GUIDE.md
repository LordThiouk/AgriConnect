# Guide de Déploiement de la Migration Auth Logs

## 🎯 Objectif
Déployer la migration `20250830020002_create_auth_logs_table.sql` sur Supabase pour activer le système de journalisation d'authentification.

## 📋 Instructions de Déploiement

### Option 1: Via le Dashboard Supabase (Recommandé)

1. **Ouvrir le Dashboard Supabase**
   - URL: https://supabase.com/dashboard/project/swggnqbymblnyjcocqxi
   - Connectez-vous avec vos identifiants

2. **Accéder au SQL Editor**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Exécuter la Migration**
   - Copiez tout le contenu du fichier `supabase/migrations/20250830020002_create_auth_logs_table.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" (ou Ctrl+Enter)

4. **Vérifier la Création**
   - Allez dans "Table Editor" (menu de gauche)
   - Vérifiez que la table `auth_logs` apparaît dans la liste
   - Cliquez sur `auth_logs` pour voir sa structure

5. **Vérifier les Fonctions**
   - Allez dans "Database Functions" (menu de gauche)
   - Vérifiez que ces fonctions ont été créées:
     - `log_auth_event`
     - `get_auth_log_stats`
     - `cleanup_old_auth_logs`

### Option 2: Via la CLI Supabase (Si disponible)

```bash
# 1. S'assurer que Supabase est lié
npx supabase link --project-ref swggnqbymblnyjcocqxi

# 2. Déployer la migration
npx supabase db push

# 3. Vérifier le statut
npx supabase status
```

## 🔍 Vérification Post-Déploiement

### 1. Vérifier la Table Auth Logs
```sql
-- Vérifier que la table existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'auth_logs';

-- Vérifier la structure de la table
\d auth_logs;
```

### 2. Vérifier les Fonctions
```sql
-- Lister les fonctions créées
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_auth_event', 'get_auth_log_stats', 'cleanup_old_auth_logs');
```

### 3. Tester la Fonction de Logging
```sql
-- Tester la fonction log_auth_event
SELECT log_auth_event(
    NULL, -- user_id
    'test_event', -- event_type
    'web', -- platform
    'email_password', -- auth_method
    'admin', -- user_role
    true, -- success
    '127.0.0.1'::inet, -- ip_address
    'test-agent', -- user_agent
    NULL, -- error_message
    '{"test": true}'::jsonb -- metadata
);
```

### 4. Vérifier les Politiques RLS
```sql
-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'auth_logs';
```

## 📊 Structure de la Migration

La migration `20250830020002_create_auth_logs_table.sql` crée:

### Table `auth_logs`
- **Colonnes principales**: id, user_id, event_type, platform, auth_method, user_role, success, ip_address, user_agent, error_message, metadata, created_at
- **Index**: Optimisés pour les requêtes fréquentes (user_id, event_type, platform, created_at, etc.)
- **Contraintes**: Validation des valeurs enum pour event_type, platform, auth_method

### Fonctions Utilitaires
- **`log_auth_event()`**: Journaliser un événement d'authentification
- **`get_auth_log_stats()`**: Obtenir des statistiques des logs
- **`cleanup_old_auth_logs()`**: Nettoyer les anciens logs

### Vues
- **`auth_logs_summary`**: Résumé des logs par jour/plateforme/rôle
- **`security_alerts`**: Alertes de sécurité récentes

### Politiques RLS
- **Utilisateurs**: Peuvent voir leurs propres logs
- **Admins**: Peuvent voir tous les logs
- **Superviseurs**: Peuvent voir les logs de leur coopérative
- **Services système**: Peuvent insérer des logs

## ⚠️ Points d'Attention

1. **Permissions**: Assurez-vous d'avoir les droits d'administration sur le projet Supabase
2. **Sauvegarde**: La migration est non-destructive, mais une sauvegarde est recommandée
3. **Performance**: Les index sont optimisés pour les requêtes fréquentes
4. **Sécurité**: Les politiques RLS sont strictes pour protéger les données sensibles

## 🎉 Succès

Une fois la migration déployée avec succès, vous devriez voir:
- ✅ Table `auth_logs` créée
- ✅ 3 fonctions utilitaires créées
- ✅ 2 vues créées
- ✅ Politiques RLS configurées
- ✅ Index optimisés créés

## 🔧 Dépannage

### Erreur de Permissions
- Vérifiez que vous êtes connecté avec un compte admin
- Vérifiez que le projet est bien sélectionné

### Erreur de Syntaxe SQL
- Vérifiez que tout le contenu du fichier a été copié
- Vérifiez qu'il n'y a pas de caractères invisibles

### Table Non Créée
- Vérifiez les logs d'erreur dans le SQL Editor
- Relancez la migration en cas d'erreur partielle

## 📞 Support

En cas de problème:
1. Vérifiez les logs d'erreur dans le Dashboard Supabase
2. Consultez la documentation Supabase
3. Contactez l'équipe de développement AgriConnect
