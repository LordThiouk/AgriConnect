# Plan Global de Refactorisation AgriConnect - Services et Cache

## 🎯 Objectifs
1. Refactoriser les services monolithiques en modules cohérents
2. Implémenter un système de cache intelligent et performant
3. Améliorer la maintenabilité et la scalabilité
4. Réduire les appels API redondants (visible dans les logs)

## 📊 Analyse de l'existant
- `collecte.ts` : 2307 lignes, 61 méthodes → **CRITIQUE**
- Logs montrent des requêtes répétitives (médias, cultures, parcelles)
- Services éparpillés sans cohérence architecturale
- Pas de cache centralisé

## 🏗️ Architecture cible

```
mobile/lib/
├── services/
│   ├── core/                    # Services de base
│   │   ├── api.ts              # Client Supabase + interceptors
│   │   ├── cache.ts            # Système de cache intelligent
│   │   ├── auth.ts             # Authentification
│   │   └── storage.ts          # Supabase Storage
│   ├── domain/                 # Services métier par domaine
│   │   ├── plots/              # Gestion des parcelles
│   │   │   ├── index.ts        # Service principal
│   │   │   ├── plots.ts        # CRUD parcelles
│   │   │   └── plots.cache.ts  # Cache spécifique
│   │   ├── crops/              # Gestion des cultures
│   │   ├── operations/         # Opérations + observations
│   │   ├── visits/             # Visites + dashboard
│   │   ├── media/              # Photos + documents
│   │   └── producers/          # Producteurs + coopératives
│   └── utils/                  # Utilitaires
│       ├── validation.ts       # Validation Zod
│       ├── offline.ts          # Gestion offline
│       └── performance.ts      # Métriques + monitoring
├── types/
│   ├── core/                   # Types de base
│   │   ├── api.ts             # Types API génériques
│   │   ├── cache.ts           # Types cache
│   │   └── common.ts          # Types communs
│   ├── domain/                # Types par domaine
│   │   ├── plots.ts           # Types parcelles
│   │   ├── crops.ts           # Types cultures
│   │   ├── operations.ts      # Types opérations
│   │   └── visits.ts          # Types visites
│   └── schemas/               # Schémas Zod
│       ├── plot.ts            # Validation parcelles
│       ├── crop.ts            # Validation cultures
│       └── operation.ts       # Validation opérations
└── hooks/                     # Hooks personnalisés
    ├── usePlots.ts            # Hook parcelles avec cache
    ├── useCrops.ts            # Hook cultures avec cache
    ├── useOperations.ts       # Hook opérations avec cache
    └── useCache.ts            # Hook cache général
```

## 🚀 Phase 1: Infrastructure de base (Semaine 1)

### 1.1 Système de cache intelligent
- Cache hiérarchique : Mémoire → AsyncStorage → API
- Invalidation intelligente par patterns
- TTL configurable par type de données
- Métriques de performance

### 1.2 Client API centralisé
- Interceptors pour gestion d'erreurs
- Cache automatique avec TTL
- Retry logic avec backoff
- Logging des performances

### 1.3 Types et schémas de base
- Types stricts avec validation Zod
- Interfaces pour cache et API
- Types partagés entre domaines

## 🔧 Phase 2: Refactorisation des services (Semaine 2-3)

### 2.1 Service Plots (Priorité 1)
- Extraire 15-20 méthodes de collecte.ts
- Cache intelligent pour parcelles
- Hook usePlots avec cache intégré

### 2.2 Services Cultures & Opérations
- CropsService et OperationsService
- Hooks useCrops et useOperations
- Migration progressive des écrans

## 📱 Phase 3: Migration progressive (Semaine 4)

### 3.1 Migration par blocs
- Étape 1: Parcelles (15-20 méthodes)
- Étape 2: Cultures (10-15 méthodes)  
- Étape 3: Opérations (15-20 méthodes)
- Étape 4: Visites (10-15 méthodes)
- Étape 5: Nettoyer collecte.ts

### 3.2 Stratégie de migration
- Garder compatibilité pendant transition
- Déprécier progressivement les anciennes méthodes
- Tests d'intégration à chaque étape

## 🎯 Phase 4: Optimisations avancées (Semaine 5)

### 4.1 Cache prédictif
- Précharger les données fréquemment utilisées
- Cache intelligent basé sur les patterns d'usage

### 4.2 Métriques et monitoring
- Tracking des performances cache
- Monitoring des appels API
- Alertes sur les dégradations

## 📋 Plan d'exécution détaillé

### Semaine 1: Infrastructure
- [x] Créer `AgriConnectCache` avec AsyncStorage
- [x] Créer `ApiClient` centralisé
- [x] Définir types et schémas de base
- [x] Tests unitaires pour le cache

### Semaine 2 : Services Plots
- [x] Extraire méthodes parcelles de `collecte.ts`
- [x] Créer `PlotsService` avec cache
- [x] Créer hook `usePlots`
- [ ] Migrer les écrans parcelles

### Semaine 3: Services Cultures & Opérations
- [x] Créer `CropsService` et `OperationsService`
- [x] Hooks `useCrops` et `useOperations`
- [ ] Migrer les écrans cultures/opérations
- [ ] Tests d'intégration

### Semaine 4 : Services Visites & Dashboard
- [x] Créer `VisitsService` et `DashboardService`
- [x] Optimiser les RPC calls
- [x] Migrer le dashboard agent
- [x] Nettoyer `collecte.ts`

### Semaine 5: Optimisations
- [ ] Cache prédictif
- [ ] Métriques de performance
- [ ] Tests de charge
- [ ] Documentation

## 🎯 Résultats attendus

### Performance
- Réduction de 70% des appels API redondants
- Temps de réponse < 200ms pour les données en cache
- Amélioration de l'expérience utilisateur

### Maintenabilité
- Code modulaire et testable
- Services avec responsabilités claires
- Types stricts avec validation

### Scalabilité
- Architecture extensible
- Cache intelligent et adaptatif
- Monitoring des performances

## 📝 Notes importantes

### Problèmes identifiés dans les logs
- Requêtes répétitives pour médias (lignes 991-1022)
- Cultures chargées plusieurs fois (lignes 987-990)
- Opérations dupliquées (lignes 995, 999)

### Stratégie de cache
- Cache local avec AsyncStorage (pas de Redis pour mobile)
- Invalidation par patterns (ex: `plots:agent:${agentId}*`)
- TTL adaptatif selon le type de données

### Migration progressive
- Maintenir la compatibilité pendant la transition
- Déprécier les anciennes méthodes avec warnings
- Tests à chaque étape pour éviter les régressions

## 🚨 Risques et mitigations

### Risques
- Casser l'existant pendant la migration
- Complexité accrue de l'architecture
- Temps de développement important

### Mitigations
- Migration progressive par petits blocs
- Tests unitaires et d'intégration
- Documentation détaillée
- Rollback possible à chaque étape

---

**Status actuel** : Phase 3 en cours.
**Prochaine étape** : Continuer la migration des écrans principaux.
