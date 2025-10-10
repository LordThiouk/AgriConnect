# Guide de Maintenance - Synchronisation des Rôles

Ce document explique comment maintenir la cohérence des rôles utilisateur dans AgriConnect et éviter les problèmes de synchronisation à l'avenir.

## 🎯 Objectif

Assurer que les rôles utilisateur sont toujours synchronisés entre :
- La table `profiles` (source de vérité)
- Les `user_metadata` de Supabase Auth (pour l'interface web)

## 🔧 Mécanismes Automatiques

### 1. Trigger PostgreSQL
Un trigger automatique synchronise les rôles lors de toute modification de la table `profiles` :

```sql
-- Le trigger se déclenche automatiquement sur :
INSERT INTO profiles (user_id, role, display_name, ...);
UPDATE profiles SET role = 'admin' WHERE user_id = '...';
```

### 2. Validation des Rôles
Les rôles sont validés contre l'enum `user_role` :
- `admin` : Accès complet (web + mobile)
- `supervisor` : Supervision (web + mobile)  
- `coop_admin` : Administrateur coopérative (web + mobile)
- `agent` : Agent de terrain (mobile uniquement)
- `producer` : Producteur (mobile uniquement)

## 📋 Scripts de Maintenance

### Vérification Rapide
```bash
# Vérifier la cohérence (exit code 0 = OK, 1 = problème)
node scripts/maintenance-role-sync.js check
```

### Rapport Détaillé
```bash
# Générer un rapport complet
node scripts/maintenance-role-sync.js report
```

### Maintenance Complète
```bash
# Synchroniser tous les rôles incohérents
node scripts/maintenance-role-sync.js maintenance
```

### Synchronisation Manuelle
```bash
# Synchroniser tous les utilisateurs
node scripts/sync-all-user-roles.js sync

# Vérifier la cohérence
node scripts/sync-all-user-roles.js check
```

## 🚨 Résolution des Problèmes

### Problème : "Plateforme non autorisée"
**Symptôme** : L'utilisateur ne peut pas accéder à l'interface web malgré un rôle valide.

**Diagnostic** :
```bash
# 1. Vérifier la cohérence
node scripts/maintenance-role-sync.js check

# 2. Si incohérent, synchroniser
node scripts/maintenance-role-sync.js maintenance

# 3. Vérifier un utilisateur spécifique
node scripts/test-user-access.js <user_id>
```

**Solution** :
```bash
# Synchroniser les métadonnées d'un utilisateur spécifique
node scripts/update-user-metadata.js <user_id>
```

### Problème : Rôle Invalide
**Symptôme** : Erreur lors de la création/modification d'un profil.

**Solution** :
```sql
-- Utiliser les fonctions de validation
SELECT public.create_profile_with_validation(
  'user_id'::UUID,
  'admin',  -- Rôle valide
  'Nom Utilisateur',
  'Région',
  'Coopérative'
);
```

## 🔄 Maintenance Régulière

### Quotidienne (Automatique)
- Le trigger PostgreSQL synchronise automatiquement les modifications
- Aucune action manuelle requise

### Hebdomadaire (Recommandé)
```bash
# Vérifier la cohérence
node scripts/maintenance-role-sync.js check

# Si des problèmes sont détectés, exécuter la maintenance
node scripts/maintenance-role-sync.js maintenance
```

### Mensuelle (Recommandé)
```bash
# Générer un rapport complet
node scripts/maintenance-role-sync.js report
```

## 📊 Monitoring

### Vue de Cohérence
```sql
-- Voir tous les utilisateurs et leur statut de cohérence
SELECT * FROM public.role_consistency_report;
```

### Logs d'Audit
```sql
-- Voir les opérations de synchronisation
SELECT * FROM auth_logs 
WHERE action IN ('role_sync', 'profile_sync')
ORDER BY created_at DESC;
```

## 🛠️ Fonctions Utilitaires

### Créer un Profil avec Validation
```sql
SELECT public.create_profile_with_validation(
  'user_id'::UUID,
  'admin',
  'Nom Utilisateur',
  'Région',
  'Coopérative'
);
```

### Mettre à Jour un Profil avec Validation
```sql
SELECT public.update_profile_with_validation(
  'user_id'::UUID,
  'supervisor',  -- Nouveau rôle
  'Nouveau Nom'  -- Nouveau nom
);
```

### Vérifier la Cohérence
```sql
-- Nombre d'utilisateurs incohérents
SELECT public.check_role_consistency();

-- Synchroniser tous les utilisateurs
SELECT public.sync_all_user_roles();
```

## ⚠️ Bonnes Pratiques

### ✅ À Faire
- Utiliser les fonctions de validation pour créer/modifier des profils
- Exécuter la maintenance hebdomadaire
- Surveiller les logs d'audit
- Tester l'accès web après toute modification de rôle

### ❌ À Éviter
- Modifier directement les `user_metadata` sans passer par la table `profiles`
- Créer des profils sans validation
- Ignorer les alertes de cohérence
- Modifier les rôles en base sans tester l'accès

## 🆘 Support

En cas de problème persistant :

1. **Vérifier les logs** :
   ```bash
   node scripts/maintenance-role-sync.js report
   ```

2. **Synchroniser manuellement** :
   ```bash
   node scripts/sync-all-user-roles.js sync
   ```

3. **Vérifier un utilisateur spécifique** :
   ```bash
   node scripts/test-user-access.js <user_id>
   ```

4. **Contacter l'équipe technique** avec les logs d'erreur.

## 📈 Métriques de Succès

- **0 utilisateur incohérent** : Objectif quotidien
- **< 1% d'erreurs de synchronisation** : Objectif mensuel
- **Temps de résolution < 5 minutes** : Objectif de support

---

*Ce guide est maintenu à jour avec les évolutions du système. Dernière mise à jour : Août 2025*
