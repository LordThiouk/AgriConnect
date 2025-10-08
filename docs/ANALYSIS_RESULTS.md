# 📊 Résultats de l'Analyse Comparative

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                  ANALYSE: plots vs farm_file_plots              │
├─────────────────────────────────────────────────────────────────┤
│  Date: 1er octobre 2025                                         │
│  Script: analyze-farm-file-plots-vs-plots.js                    │
│  Statut: ✅ Analyse terminée avec succès                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Comparaison des Tables

### Métriques Globales

```
┌─────────────────┬─────────┬──────────────────┐
│    Métrique     │  plots  │ farm_file_plots  │
├─────────────────┼─────────┼──────────────────┤
│ Nombre de       │   29    │       24         │
│ lignes          │         │                  │
├─────────────────┼─────────┼──────────────────┤
│ Nombre de       │    8    │       22         │
│ colonnes        │         │                  │
├─────────────────┼─────────┼──────────────────┤
│ Tables          │    6    │        3         │
│ dépendantes     │         │                  │
├─────────────────┼─────────┼──────────────────┤
│ Fonctions       │    2    │        5         │
│ RPC             │         │                  │
└─────────────────┴─────────┴──────────────────┘
```

### Colonnes

```
┌──────────────────────────────────────────────────────────┐
│                    COLONNES COMMUNES (6)                 │
├──────────────────────────────────────────────────────────┤
│  ✓ id              ✓ producer_id      ✓ geom            │
│  ✓ created_at      ✓ updated_at       ✓ cooperative_id  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│         COLONNES UNIQUEMENT DANS plots (2)               │
├──────────────────────────────────────────────────────────┤
│  ⚠️  name                                                 │
│  ⚠️  created_by                                           │
│                                                          │
│  → À migrer vers farm_file_plots                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    COLONNES UNIQUEMENT DANS farm_file_plots (16)         │
├──────────────────────────────────────────────────────────┤
│  ✅ name_season_snapshot   ✅ area_hectares              │
│  ✅ soil_type              ✅ soil_ph                    │
│  ✅ water_source           ✅ irrigation_type            │
│  ✅ slope_percent          ✅ elevation_meters           │
│  ✅ center_point           ✅ status                     │
│  ✅ notes                  ✅ farm_file_id               │
│  ✅ typology               ✅ producer_size              │
│  ✅ cotton_variety         ✅ plot_id                    │
│                                                          │
│  → farm_file_plots est plus riche en données            │
└──────────────────────────────────────────────────────────┘
```

---

## 🔗 Analyse des Dépendances

### Tables Référençant `plots`

```
┌───────────────────────────────────────────────────────────┐
│            6 TABLES DÉPENDANTES (⚠️ À MIGRER)             │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. crops.plot_id → plots.id                             │
│  2. operations.plot_id → plots.id                        │
│  3. observations.plot_id → plots.id                      │
│  4. visits.plot_id → plots.id                            │
│  5. recommendations.plot_id → plots.id                   │
│  6. media.entity_id → plots.id (entity_type='plot')      │
│                                                           │
│  Action requise: Ajouter farm_file_plot_id à toutes      │
└───────────────────────────────────────────────────────────┘
```

### Tables Référençant `farm_file_plots`

```
┌───────────────────────────────────────────────────────────┐
│         3 TABLES DÉPENDANTES (✅ DÉJÀ EN PLACE)           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. crops.farm_file_plot_id → farm_file_plots.id         │
│  2. operations.farm_file_plot_id → farm_file_plots.id    │
│  3. observations.farm_file_plot_id → farm_file_plots.id  │
│                                                           │
│  Note: Ces tables ont DÉJÀ les deux colonnes             │
└───────────────────────────────────────────────────────────┘
```

### Fonctions RPC

```
┌───────────────────────────────────────────────────────────┐
│         FONCTIONS UTILISANT plots (⚠️ À MIGRER)           │
├───────────────────────────────────────────────────────────┤
│  1. get_plot_by_id                                        │
│  2. delete_plot_cascade                                   │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│     FONCTIONS UTILISANT farm_file_plots (✅ ACTIVES)      │
├───────────────────────────────────────────────────────────┤
│  1. get_plots_with_geolocation                            │
│  2. get_plots_with_geolocation_count                      │
│  3. get_plot_by_id (utilise les deux tables)             │
│  4. get_plots_by_producer                                 │
│  5. get_agent_today_visits                                │
└───────────────────────────────────────────────────────────┘
```

---

## 📊 Analyse des Données

### Chevauchement

```
┌────────────────────────────────────────────────────────────┐
│                  ANALYSE DE CHEVAUCHEMENT                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  farm_file_plots avec plot_id NON NULL:  24 lignes (100%) │
│  farm_file_plots avec plot_id NULL:       0 ligne   (0%)  │
│                                                            │
│  plots sans correspondance:                5 lignes        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  CONCLUSION                                                │
├────────────────────────────────────────────────────────────┤
│  ✅ Toutes les lignes de farm_file_plots ont un plot_id   │
│  ⚠️  5 lignes dans plots n'ont PAS de correspondance      │
│                                                            │
│  Action requise: Migrer ces 5 lignes vers farm_file_plots │
└────────────────────────────────────────────────────────────┘
```

### Distribution

```
         plots (29 lignes)              farm_file_plots (24 lignes)
    ┌─────────────────────┐           ┌─────────────────────┐
    │                     │           │                     │
    │  ████████████████   │◄─────────►│  ████████████████   │
    │  ████████████████   │  24 lignes│  ████████████████   │
    │  ████████████████   │  liées    │  ████████████████   │
    │  ████████████████   │           │                     │
    │  █████              │           │                     │
    │    5 lignes         │           └─────────────────────┘
    │    orphelines       │
    │                     │
    └─────────────────────┘
```

---

## 🎯 Conclusion

### ✅ Points Positifs

1. **farm_file_plots est plus complète** (22 colonnes vs 8)
2. **24/29 lignes déjà synchronisées** (83%)
3. **Structure moderne** avec toutes les métadonnées agricoles
4. **5 fonctions RPC déjà utilisent farm_file_plots**

### ⚠️ Travail Restant

1. **Migrer 5 lignes orphelines** de plots vers farm_file_plots
2. **Ajouter 2 colonnes** à farm_file_plots (name, created_by)
3. **Migrer 6 tables dépendantes** (ajouter farm_file_plot_id)
4. **Mettre à jour 2 fonctions RPC** (get_plot_by_id, delete_plot_cascade)
5. **Mettre à jour le code frontend** (web + mobile)

### 📈 Impact Estimé

```
┌──────────────────────────────────────────────────────────┐
│                    IMPACT DE LA MIGRATION                │
├──────────────────────────────────────────────────────────┤
│  Complexité:          ████████░░ 8/10                    │
│  Risque:              ██████░░░░ 6/10                    │
│  Durée estimée:       2-3 mois (avec monitoring)         │
│  Migrations SQL:      ~15 fichiers                       │
│  Fichiers code:       ~20-30 fichiers (web + mobile)    │
└──────────────────────────────────────────────────────────┘
```

---

## 🚦 Statut de Recommandation

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  RECOMMANDATION: ⚠️  MIGRATION REQUISE                    ║
║                                                           ║
║  La table 'plots' est encore utilisée par 8 dépendances. ║
║  Une migration complète est nécessaire avant suppression. ║
║                                                           ║
║  Prochaine étape:                                         ║
║  → Suivre le plan détaillé dans                           ║
║    docs/refactoring-plots-to-farm-file-plots.md          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📚 Ressources

### Documentation Créée

1. ✅ **Plan de refactoring complet**
   - `docs/refactoring-plots-to-farm-file-plots.md`
   - 10 phases détaillées avec SQL

2. ✅ **Résumé exécutif**
   - `docs/REFACTORING_SUMMARY.md`
   - Vue d'ensemble et démarrage rapide

3. ✅ **Script d'analyse**
   - `scripts/analyze-farm-file-plots-vs-plots.js`
   - Réexécutable à tout moment

4. ✅ **README analyse**
   - `scripts/README_ANALYZE.md`
   - Guide d'utilisation

### Commandes Utiles

```bash
# Réexécuter l'analyse
npm run analyze:tables

# Identifier les lignes orphelines
psql -c "SELECT * FROM plots WHERE id NOT IN (SELECT plot_id FROM farm_file_plots)"

# Rechercher les références dans le code
grep -r "\.from('plots')" web/src mobile/app

# Déployer une migration
supabase db push
```

---

**Généré le**: 1er octobre 2025  
**Script**: `scripts/analyze-farm-file-plots-vs-plots.js`  
**Version**: 1.0.0

