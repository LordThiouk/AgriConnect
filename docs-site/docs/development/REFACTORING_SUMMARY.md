# 📊 Résumé de l'Analyse: farm_file_plots vs plots

## ✅ Ce qui a été fait

### 1. Script d'Analyse Créé
- **Fichier**: `scripts/analyze-farm-file-plots-vs-plots.js`
- **Commande**: `npm run analyze:tables`
- **Documentation**: `scripts/README_ANALYZE.md`

### 2. Résultats de l'Analyse

#### Structure des Tables

| Aspect | plots | farm_file_plots |
|--------|-------|-----------------|
| **Lignes** | 29 | 24 |
| **Colonnes** | 8 | 22 |
| **Colonnes communes** | 6 | 6 |
| **Colonnes uniques** | 2 | 16 |

#### Dépendances Critiques

**Tables dépendantes**:
- ⚠️ `crops` (plot_id)
- ⚠️ `operations` (plot_id)
- ⚠️ `observations` (plot_id)
- ⚠️ `visits` (plot_id)
- ⚠️ `recommendations` (plot_id)
- ⚠️ `media` (entity_id quand entity_type='plot')

**Fonctions RPC à migrer**:
- ⚠️ `get_plot_by_id`
- ⚠️ `delete_plot_cascade`

#### Points Clés

1. **5 lignes orphelines** dans `plots` sans correspondance dans `farm_file_plots`
2. **24 lignes** dans `farm_file_plots` avec `plot_id` valide (100%)
3. **farm_file_plots est plus riche** en informations (22 colonnes vs 8)
4. **8 dépendances critiques** à migrer (6 tables + 2 RPC)

### 3. Documentation Créée

- ✅ **Plan de refactoring complet**: `docs/refactoring-plots-to-farm-file-plots.md`
  - 10 phases détaillées
  - Migrations SQL prêtes à l'emploi
  - Timeline de 2.5 mois
  - Analyse des risques

- ✅ **Liste de tâches**: 9 TODO créés dans Cursor

- ✅ **Migration helper**: `supabase/migrations/20251001080000_create_exec_sql_helper.sql`

---

## 🎯 Prochaines Étapes Recommandées

### Immédiat (Aujourd'hui)

1. **Identifier les 5 lignes manquantes**
   ```sql
   SELECT p.*
   FROM public.plots p
   WHERE NOT EXISTS (
     SELECT 1 FROM public.farm_file_plots ffp
     WHERE ffp.plot_id = p.id
   );
   ```

2. **Rechercher les références dans le code**
   ```bash
   # Web
   grep -r "\.from('plots')" web/src
   
   # Mobile
   grep -r "\.from('plots')" mobile/app mobile/lib
   
   # Lib partagée
   grep -r "plots" lib/services
   ```

### Court terme (Cette semaine)

3. **Créer la première migration**
   - Ajouter `created_by` à `farm_file_plots`
   - Tester sur staging

4. **Migrer les 5 lignes manquantes**
   - Utiliser la migration SQL fournie
   - Valider l'intégrité des données

5. **Commencer la migration des tables dépendantes**
   - Commencer par `visits` (la plus simple)
   - Ajouter `farm_file_plot_id` à côté de `plot_id`

### Moyen terme (2-3 semaines)

6. **Migrer toutes les tables dépendantes**
   - Progresser une table à la fois
   - Tester après chaque migration

7. **Migrer les fonctions RPC**
   - `get_plot_by_id` en premier
   - `delete_plot_cascade` ensuite

8. **Mettre à jour le frontend**
   - Services API (web + mobile)
   - Hooks et composants

### Long terme (2 mois)

9. **Monitoring et validation**
   - Surveiller les performances
   - Corriger les bugs éventuels
   - Valider avec les utilisateurs

10. **Dépréciation et suppression**
    - Créer la vue legacy
    - Supprimer `plots` après validation complète

---

## ⚠️ Points d'Attention

### Risques Majeurs

1. **Perte de données**
   - Solution: Backup avant chaque migration
   - Tester sur staging d'abord

2. **Rupture du frontend**
   - Solution: Migration progressive
   - Garder les deux colonnes temporairement

3. **Performance**
   - Solution: Index appropriés
   - Monitoring continu

### Checklist Avant de Commencer

- [ ] **Backup complet** de la base de données production
- [ ] **Environnement de staging** prêt et synchronisé
- [ ] **Tests de régression** préparés
- [ ] **Communication** avec l'équipe
- [ ] **Plan de rollback** documenté
- [ ] **Monitoring** configuré

---

## 📚 Ressources Disponibles

### Scripts

1. **Analyse**: `npm run analyze:tables`
   - Analyse comparative complète
   - Identification des dépendances
   - Recommandations

2. **Tests** (à créer):
   - `tests/refactoring/plots-migration.test.js`

### Documentation

1. **Plan détaillé**: `docs/refactoring-plots-to-farm-file-plots.md`
   - 10 phases avec migrations SQL
   - Timeline et estimations
   - Risques et mitigations

2. **README analyse**: `scripts/README_ANALYZE.md`
   - Guide d'utilisation du script
   - Dépannage

3. **Memory Bank**: `.cursor/memory-bank/activeContext.md`
   - Contexte du projet
   - Historique des décisions

### Migrations Prêtes

Toutes les migrations SQL sont documentées dans `docs/refactoring-plots-to-farm-file-plots.md`:

- ✅ Ajout colonnes manquantes
- ✅ Migration données
- ✅ Migration tables dépendantes (6)
- ✅ Migration fonctions RPC (2)
- ✅ Création vue legacy
- ✅ Dépréciation et suppression

---

## 💡 Conseils

### Ordre d'Exécution

1. **Toujours tester sur staging d'abord**
2. **Une migration à la fois**
3. **Valider après chaque étape**
4. **Garder les colonnes legacy temporairement**
5. **Supprimer uniquement après validation complète**

### Communication

- **Informer l'équipe** avant chaque phase
- **Documenter les changements** au fur et à mesure
- **Partager les résultats** des tests
- **Demander validation** avant suppression

### Monitoring

- **Surveiller les logs** pendant la migration
- **Vérifier les performances** après chaque phase
- **Collecter les feedbacks** utilisateurs
- **Ajuster le plan** si nécessaire

---

## 🚀 Démarrage Rapide

Pour commencer la migration maintenant:

```bash
# 1. Exécuter l'analyse
npm run analyze:tables

# 2. Identifier les lignes manquantes
supabase db pull  # Si besoin de sync

# 3. Créer la première migration
# Copier depuis docs/refactoring-plots-to-farm-file-plots.md
# Section "Phase 2: Migration des Colonnes"

# 4. Tester sur staging
supabase db push --project-ref staging-ref

# 5. Valider et déployer en production
supabase db push --project-ref prod-ref
```

---

## 📞 Support

En cas de problème:

1. **Consulter la documentation**: `docs/refactoring-plots-to-farm-file-plots.md`
2. **Réexécuter l'analyse**: `npm run analyze:tables`
3. **Vérifier les migrations**: `supabase/migrations/`
4. **Consulter le Memory Bank**: `.cursor/memory-bank/`

---

**Date de création**: 1er octobre 2025  
**Dernière mise à jour**: 1er octobre 2025  
**Version**: 1.0.0

---

> ⚠️ **Important**: Ce refactoring est une opération critique. Suivez scrupuleusement le plan et testez chaque étape.

