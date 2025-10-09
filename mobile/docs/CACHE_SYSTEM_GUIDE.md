# Guide du Système de Cache AgriConnect

## 🎯 Objectif

Le système de cache intelligent AgriConnect résout les problèmes de requêtes répétitives visibles dans les logs et améliore significativement les performances de l'application.

## 📊 Problèmes Résolus

### Avant (Logs actuels)
```
LOG  🌾 Récupération de toutes les cultures pour la parcelle: d5d5d2fa-3aef-417e-8e00-cd913a4d38bd
LOG  🌾 Récupération de toutes les cultures pour la parcelle: d5d5d2fa-3aef-417e-8e00-cd913a4d38bd  // DUPLIQUÉ
LOG  📸 [PhotoGallery] Chargement photos pour: {"entityId": "d5d5d2fa-3aef-417e-8e00-cd913a4d38bd", "entityType": "plot"}
LOG  📸 [MEDIA] Récupération médias: {"entityId": "d5d5d2fa-3aef-417e-8e00-cd913a4d38bd", "entityType": "plot"}
LOG  📸 [PhotoGallery] Chargement photos pour: {"entityId": "1b74754a-ce99-4c6b-9ed7-83b55e0460a5", "entityType": "operation"}
LOG  📸 [PhotoGallery] Chargement photos pour: {"entityId": "3fdf007d-a4d1-4bcc-b120-697c51ff9db9", "entityType": "operation"}
LOG  📸 [PhotoGallery] Chargement photos pour: {"entityId": "a930d1e9-2219-4dce-8595-4593d45206ed", "entityType": "operation"}
```

### Après (Avec cache)
```
LOG  🌾 Récupération de toutes les cultures pour la parcelle: d5d5d2fa-3aef-417e-8e00-cd913a4d38bd
LOG  ⚡ [CACHE] Hit pour 8 éléments (cultures)
LOG  ⚡ [CACHE] Hit pour 0 médias (plot)
LOG  ⚡ [CACHE] Hit pour 0 médias (operation:1b74754a...)
LOG  ⚡ [CACHE] Hit pour 0 médias (operation:3fdf007d...)
LOG  ⚡ [CACHE] Hit pour 0 médias (operation:a930d1e9...)
```

## 🏗️ Architecture

### Structure des fichiers
```
mobile/lib/
├── types/core/           # Types TypeScript
│   ├── cache.ts         # Types pour le cache
│   ├── api.ts           # Types pour l'API client
│   └── common.ts        # Types communs
├── services/core/       # Services de base
│   ├── cache.ts         # Système de cache intelligent
│   ├── api.ts           # Client API centralisé
│   └── interceptors.ts  # Interceptors par défaut
└── hooks/              # Hooks React
    └── useCache.ts     # Hooks pour utiliser le cache
```

### Flux de données
```
Composant → Hook → Cache (Mémoire) → Cache (AsyncStorage) → API → Supabase
    ↑                                                              ↓
    ←────────────────── Données mises en cache ←───────────────────
```

## 🚀 Utilisation

### 1. Hooks simples (Recommandé)

```typescript
import { usePlotsCache, usePlotCache, useCropsCache } from '../lib/hooks';

function PlotsComponent({ agentId }: { agentId: string }) {
  const { data: plots, loading, error, refetch } = usePlotsCache(agentId, {
    refetchOnMount: true,
    onError: (error) => console.error('Erreur parcelles:', error),
  });

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return (
    <FlatList
      data={plots}
      renderItem={({ item }) => <PlotItem plot={item} />}
      onRefresh={refetch}
    />
  );
}
```

### 1.2 Liste des Hooks Disponibles

La couche de hooks a été complétée pour couvrir tous les domaines fonctionnels. Voici une liste des principaux hooks que vous pouvez désormais importer depuis `../lib/hooks` :

-   **useAgentProducers(agentId)**: Récupère les producteurs d'un agent.
-   **useProducerById(producerId)**: Récupère un producteur spécifique.
-   **useAgentAlerts(agentId)**: Récupère les alertes pour un agent.
-   **useAgentAssignments(agentId)**: Récupère les assignations d'un agent.
-   **useCooperatives()**: Récupère la liste de toutes les coopératives.
-   **useInputsByCategory(category)**: Récupère les intrants par catégorie.
-   **usePlotParticipants(plotId)**: Récupère les participants d'une parcelle.
-   **useUserNotifications(userId)**: Récupère les notifications d'un utilisateur.
-   **useUnreadNotificationsCount(userId)**: Compte les notifications non lues.
-   **useUserRecommendations(userId)**: Récupère les recommandations pour un utilisateur.
-   **useActiveSeason()**: Récupère la saison agricole active.

*Cette liste n'est pas exhaustive. Référez-vous aux fichiers dans `mobile/lib/hooks/` pour découvrir tous les hooks disponibles et leurs paramètres.*

### 2. API Client direct

```typescript
import { agriConnectApi } from '../lib/services/core';

// Récupération avec cache automatique
const plots = await agriConnectApi.getPlots(agentId);

// RPC avec cache
const dashboard = await agriConnectApi.getDashboard(agentId);
```

### 3. Cache manuel

```typescript
import { agriConnectCache, CacheKeys } from '../lib/services/core';

// Stocker des données
await agriConnectCache.set('custom:key', data, 'medium');

// Récupérer des données
const data = await agriConnectCache.get('custom:key');

// Invalider par pattern
await agriConnectCache.invalidate({ pattern: 'plots:agent:*' });
```

## ⚙️ Configuration

### TTL (Time To Live) par défaut
- `'short'`: 1 minute (opérations, observations)
- `'medium'`: 5 minutes (parcelles, cultures)
- `'long'`: 15 minutes (médias, producteurs)
- `'very-long'`: 1 heure (données statiques)

### Configuration du cache
```typescript
import { agriConnectCache } from '../lib/services/core';

// Configuration personnalisée
agriConnectCache.initialize({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryEntries: 100,
  maxStorageSize: 50, // 50 MB
  enableMetrics: __DEV__,
});
```

## 📊 Monitoring et Métriques

### Métriques disponibles
```typescript
import { agriConnectCache, agriConnectApi } from '../lib/services/core';

// Métriques du cache
const cacheMetrics = agriConnectCache.getMetrics();
console.log('Hit rate:', cacheMetrics.hitRate + '%');
console.log('Total requests:', cacheMetrics.hits + cacheMetrics.misses);

// Métriques de l'API
const apiMetrics = agriConnectApi.getMetrics();
console.log('Cached responses:', apiMetrics.cachedResponses);
console.log('Average response time:', apiMetrics.averageResponseTime + 'ms');
```

### Statistiques en temps réel
```typescript
import { useCacheStats } from '../lib/hooks/useCache';

function CacheStatsComponent() {
  const { stats, metrics } = useCacheStats();
  
  return (
    <View>
      <Text>Clés en cache: {stats.totalKeys}</Text>
      <Text>Taux de hit: {metrics.hitRate.toFixed(1)}%</Text>
      <Text>Temps moyen: {metrics.averageResponseTime.toFixed(0)}ms</Text>
    </View>
  );
}
```

## 🔄 Migration depuis l'existant

### Étape 1: Remplacer les services
```typescript
// AVANT
// @deprecated - Use domain services instead
// import { CollecteService } from '../lib/services/collecte';
// @deprecated - Use PlotsService instead
// const plots = await CollecteService.getPlots(agentId);

// APRÈS
import { agriConnectApi } from '../lib/services/core';
const plots = await agriConnectApi.getPlots(agentId);
```

### Étape 2: Utiliser les hooks
```typescript
// AVANT
const [plots, setPlots] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // @deprecated - Use PlotsService instead
  // CollecteService.getPlots(agentId).then(setPlots);
}, [agentId]);

// APRÈS
const { data: plots, loading } = usePlotsCache(agentId);
```

### Étape 3: Invalidation après modifications
```typescript
// AVANT
// @deprecated - Use PlotsService instead
// await CollecteService.addPlot(plotData);

// APRÈS
// @deprecated - Use PlotsService instead
// await CollecteService.addPlot(plotData);
await agriConnectCache.invalidate({ pattern: `plots:agent:${agentId}` });
```

## 🧪 Tests

### Test du système de cache
```bash
cd mobile
node scripts/test-cache-system.js
```

### Tests d'intégration
```typescript
import { CacheIntegrationTests } from '../lib/examples/cache-integration-example';

const results = await CacheIntegrationTests.testCacheIntegration();
console.log('Amélioration:', results.improvement + '%');
```

## 🎯 Bénéfices Attendus

### Performance
- **Réduction de 70%** des appels API redondants
- **Temps de réponse < 200ms** pour les données en cache
- **Amélioration de l'UX** avec chargement instantané

### Réduction des logs
- **Avant**: 15+ requêtes répétitives par écran
- **Après**: 1 requête initiale + hits cache

### Maintenabilité
- Code modulaire et testable
- Types stricts avec validation
- Architecture extensible

## 🚨 Bonnes Pratiques

### 1. Invalidation intelligente
```typescript
// Après modification d'une parcelle
await agriConnectCache.invalidate({ 
  pattern: `plot:${plotId}*` 
});

// Après ajout d'une culture
await agriConnectCache.invalidate({ 
  pattern: `crops:plot:${plotId}` 
});
```

### 2. Gestion des erreurs
```typescript
const { data, error, refetch } = usePlotsCache(agentId, {
  onError: (error) => {
    console.error('Erreur cache:', error);
    // Fallback vers l'ancien système si nécessaire
  },
});
```

### 3. Monitoring en production
```typescript
// Ajouter des listeners pour le monitoring
agriConnectCache.addEventListener((event) => {
  if (event.type === 'miss' && event.responseTime > 1000) {
    console.warn(`Cache miss lent: ${event.key}`);
  }
});
```

## 📈 Prochaines Étapes

1. **Phase 2**: Extraction des services (PlotsService, CropsService, etc.) - **Terminée** ✅
2. **Pré-Phase 3**: Création de la couche de hooks de domaine - **Terminée** ✅
3. **Phase 3**: Migration progressive des écrans - **À commencer** 🚀
4. **Phase 4**: Optimisations avancées (cache prédictif, métriques)

---

**Status**: Infrastructure de services et de hooks complétée ✅  
**Prochaine étape**: Migration des écrans de l'UI pour utiliser les nouveaux hooks
