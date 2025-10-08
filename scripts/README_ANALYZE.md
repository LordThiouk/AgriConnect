# Script d'Analyse: farm_file_plots vs plots

## 📋 Description

Ce script analyse en profondeur les tables `farm_file_plots` et `plots` pour préparer leur refactorisation. Il génère un rapport détaillé comparant structures, données, dépendances et recommandations de migration.

## 🎯 Objectifs

- Comparer les structures des deux tables (colonnes, types, contraintes)
- Analyser les données existantes (nombre de lignes, chevauchement)
- Identifier toutes les dépendances (clés étrangères, fonctions RPC, vues)
- Générer des recommandations de refactoring

## 🚀 Utilisation

### Prérequis

1. **Migration de la fonction helper** (première utilisation uniquement):
   ```bash
   # Depuis la racine du projet
   supabase db push
   ```
   Cela créera la fonction `exec_sql` nécessaire pour les requêtes de métadonnées.

2. **Variables d'environnement**:
   Assurez-vous que `.env` contient:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Dépendances Node.js**:
   ```bash
   npm install
   ```

### Exécution

```bash
# Depuis la racine du projet
node scripts/analyze-farm-file-plots-vs-plots.js
```

## 📊 Sections du Rapport

Le script génère un rapport détaillé organisé en sections:

### 1️⃣ Structure des Tables
- Liste complète des colonnes avec types et contraintes
- Comparaison des colonnes (communes, uniques à chaque table)

### 2️⃣ Analyse des Données
- Nombre de lignes dans chaque table
- Analyse de chevauchement (plot_id dans farm_file_plots)
- Identification des données orphelines

### 3️⃣ Contraintes et Index
- Clés primaires et étrangères
- Index existants
- Contraintes CHECK et UNIQUE

### 4️⃣ Analyse des Dépendances
- Tables qui référencent chaque table (foreign keys)
- Fonctions RPC utilisant chaque table
- Vues utilisant chaque table

### 5️⃣ Utilisation dans le Code
- Recommandations de recherche dans le codebase
- Commandes grep pour trouver les références

### 6️⃣ Recommandations de Refactoring
- Plan de migration en 5 phases
- Risques identifiés
- Tests requis
- Ordre d'exécution recommandé

### 📊 Résumé Exécutif
- Vue d'ensemble des deux tables
- Conclusion et prochaines étapes

## 🔍 Exemple de Sortie

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║           ANALYSE COMPARATIVE: farm_file_plots vs plots                   ║
║                                                                           ║
║                      AgriConnect - Octobre 2025                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

================================================================================
  1️⃣  STRUCTURE DES TABLES
================================================================================

▶ Table: plots
------------------------------------------------------------
   ✓ 25 colonnes trouvées

   Colonnes:
   • id                            uuid                 (NOT NULL)
   • name                          text                 (nullable)
   • producer_id                   uuid                 (nullable)
   • area_hectares                 numeric              (nullable)
   ...

▶ Table: farm_file_plots
------------------------------------------------------------
   ✓ 35 colonnes trouvées

   Colonnes:
   • id                            uuid                 (NOT NULL)
   • farm_file_id                  uuid                 (NOT NULL)
   • plot_id                       uuid                 (nullable)
   ...

================================================================================
  2️⃣  ANALYSE DES DONNÉES
================================================================================

▶ Nombre de lignes
------------------------------------------------------------
   📊 plots:            15 lignes
   📊 farm_file_plots:  29 lignes
   ✓ farm_file_plots contient 14 lignes de plus
...
```

## 🔧 Prochaines Étapes après Analyse

En fonction des résultats:

1. **Si farm_file_plots est la source de vérité** (recommandé):
   - Migrer toutes les fonctions RPC pour utiliser `farm_file_plots`
   - Mettre à jour le code frontend (web + mobile)
   - Créer une vue `plots` legacy pour compatibilité
   - Déprécier puis supprimer la table `plots`

2. **Si plots contient des données uniques**:
   - Identifier les colonnes manquantes dans `farm_file_plots`
   - Créer une migration pour ajouter ces colonnes
   - Migrer les données de `plots` vers `farm_file_plots`
   - Puis suivre l'étape 1

3. **Si les deux tables sont utilisées**:
   - Analyser les cas d'usage spécifiques
   - Créer un plan de convergence progressive
   - Documenter la stratégie de migration

## ⚠️ Avertissements

- **Sécurité**: La fonction `exec_sql` est réservée aux admins (service_role)
- **Environnement**: Toujours tester sur staging avant production
- **Backup**: Faire un backup complet avant toute migration
- **Validation**: Tester toutes les fonctionnalités après refactoring

## 📝 Notes

- Le script utilise des couleurs ANSI pour une meilleure lisibilité
- Certaines analyses peuvent échouer selon les permissions RLS
- La recherche dans le code doit être faite manuellement avec grep
- Génération de rapport prend ~10-30 secondes selon la taille de la base

## 🐛 Dépannage

### Erreur: "Variables d'environnement manquantes"
Solution: Vérifier `.env` à la racine du projet

### Erreur: "function exec_sql does not exist"
Solution: Exécuter `supabase db push` pour créer la fonction

### Erreur: "permission denied"
Solution: Utiliser SUPABASE_SERVICE_ROLE_KEY (pas ANON_KEY)

### Résultats vides ou incomplets
Solution: Vérifier les policies RLS sur les tables concernées

## 📚 Ressources

- [Memory Bank: activeContext.md](.cursor/memory-bank/activeContext.md)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide de Migration](.cursor/memory-bank/systemPatterns.md)

