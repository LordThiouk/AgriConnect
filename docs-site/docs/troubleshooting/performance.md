# ⚡ Optimisation des Performances

Guide pour optimiser les performances d'AgriConnect.

## 🎯 Vue d'ensemble

Ce guide couvre les techniques d'optimisation pour améliorer les performances de l'application mobile et web AgriConnect.

## 📱 Optimisations Mobile

### React Native Performance

```typescript
// Memoization des composants
const ProducerCard = React.memo(({ producer, onPress }: ProducerCardProps) => {
  const handlePress = useCallback(() => {
    onPress?.(producer);
  }, [producer, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{producer.name}</Text>
    </TouchableOpacity>
  );
});

// Optimisation des listes
const ProducersList = ({ producers }: { producers: Producer[] }) => {
  const renderItem = useCallback(({ item }: { item: Producer }) => (
    <ProducerCard producer={item} />
  ), []);

  const keyExtractor = useCallback((item: Producer) => item.id, []);

  return (
    <FlatList
      data={producers}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};
```

### Optimisation des Images

```typescript
// Lazy loading des images
import { Image } from 'expo-image';

const OptimizedImage = ({ uri, ...props }: ImageProps) => {
  return (
    <Image
      source={{ uri }}
      {...props}
      placeholder="blur"
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
};

// Compression des images
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

### Gestion de la Mémoire

```typescript
// Nettoyage des ressources
useEffect(() => {
  const subscription = supabase
    .channel('producers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'producers' }, 
      (payload) => {
        // Gérer les changements
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// Optimisation des requêtes
const useProducers = (cooperativeId: string) => {
  return useQuery({
    queryKey: ['producers', cooperativeId],
    queryFn: () => fetchProducers(cooperativeId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.filter(p => p.status === 'active') // Filtrage côté client
  });
};
```

## 🌐 Optimisations Web

### React Performance

```typescript
// Memoization des composants
const ProducerCard = memo(({ producer, onPress }: ProducerCardProps) => {
  const handleClick = useCallback(() => {
    onPress?.(producer);
  }, [producer, onPress]);

  return (
    <div onClick={handleClick}>
      <h3&gt;{producer.name}</h3&gt;
      <p>{producer.phone}</p>
    </div>
  );
});

// Optimisation des listes
const ProducersList = ({ producers }: { producers: Producer[] }) => {
  const [visibleItems, setVisibleItems] = useState(20);
  
  const loadMore = useCallback(() => {
    setVisibleItems(prev => prev + 20);
  }, []);

  return (
    <div>
      {producers.slice(0, visibleItems).map(producer => (
        <ProducerCard key={producer.id} producer={producer} />
      ))}
      <button onClick={loadMore}>Charger plus</button>
    </div>
  );
};
```

### Optimisation des Requêtes

```typescript
// Pagination côté serveur
const useProducers = (page: number, limit: number) => {
  return useQuery({
    queryKey: ['producers', page, limit],
    queryFn: () => fetchProducers(page, limit),
    keepPreviousData: true, // Garder les données précédentes
    staleTime: 5 * 60 * 1000
  });
};

// Requêtes parallèles
const useDashboardData = () => {
  const producersQuery = useQuery(['producers'], fetchProducers);
  const plotsQuery = useQuery(['plots'], fetchPlots);
  const operationsQuery = useQuery(['operations'], fetchOperations);

  return {
    producers: producersQuery.data,
    plots: plotsQuery.data,
    operations: operationsQuery.data,
    loading: producersQuery.isLoading || plotsQuery.isLoading || operationsQuery.isLoading
  };
};
```

### Optimisation des Assets

```typescript
// Lazy loading des composants
const PlotMap = lazy(() => import('./PlotMap'));
const Reports = lazy(() => import('./Reports'));

// Utilisation avec Suspense
<Suspense fallback={<LoadingSpinner />}>
  <PlotMap />
</Suspense>

// Optimisation des images
const OptimizedImage = ({ src, alt, ...props }: ImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};
```

## 🗄️ Optimisations Base de Données

### Indexation

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_producers_cooperative_status ON producers(cooperative_id, status);
CREATE INDEX idx_plots_producer_created ON plots(producer_id, created_at);
CREATE INDEX idx_operations_crop_date ON operations(crop_id, date);

-- Index partiels pour les données actives
CREATE INDEX idx_active_crops ON crops(plot_id) WHERE status != 'harvested';
CREATE INDEX idx_pending_recommendations ON recommendations(crop_id) WHERE status = 'pending';
```

### Requêtes Optimisées

```sql
-- Requête optimisée avec JOIN
SELECT 
  p.name as producer_name,
  pl.name as plot_name,
  c.crop_type,
  c.actual_yield_kg_ha
FROM producers p
JOIN plots pl ON p.id = pl.producer_id
JOIN crops c ON pl.id = c.plot_id
WHERE p.cooperative_id = $1
  AND c.status = 'harvested'
  AND c.actual_yield_kg_ha IS NOT NULL;

-- Requête avec pagination
SELECT * FROM producers
WHERE cooperative_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### Mise en Cache

```typescript
// Cache Redis pour les requêtes coûteuses
const getCachedProducers = async (cooperativeId: string) => {
  const cacheKey = `producers:${cooperativeId}`;
  
  // Vérifier le cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Récupérer depuis la base de données
  const producers = await supabase
    .from('producers')
    .select('*')
    .eq('cooperative_id', cooperativeId);
  
  // Mettre en cache pour 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(producers));
  
  return producers;
};
```

## 🔔 Optimisations Notifications

### Batching des SMS

```typescript
// Envoi groupé des SMS
const sendBatchedSMS = async (notifications: Notification[]) => {
  const batches = chunk(notifications, 10); // Par lots de 10
  
  for (const batch of batches) {
    const promises = batch.map(notification => 
      sendSMS(notification.phone, notification.message)
    );
    
    await Promise.allSettled(promises);
    
    // Délai entre les lots pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

### Optimisation des Push Notifications

```typescript
// Envoi groupé des push notifications
const sendBatchedPush = async (notifications: PushNotification[]) => {
  const chunks = chunk(notifications, 100); // Par lots de 100
  
  for (const chunk of chunks) {
    const messages = chunk.map(notification => ({
      to: notification.expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data
    }));
    
    await Notifications.sendPushNotificationsAsync(messages);
  }
};
```

## 📊 Monitoring des Performances

### Métriques de Performance

```typescript
// Collecte de métriques
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(label: string) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }
  
  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
  }
  
  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p95: this.percentile(values, 0.95)
    };
  }
  
  private percentile(values: number[], p: number) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Utilisation
const monitor = new PerformanceMonitor();

const fetchProducers = async () => {
  const endTimer = monitor.startTimer('fetch_producers');
  
  try {
    const result = await supabase.from('producers').select('*');
    return result;
  } finally {
    endTimer();
  }
};
```

### Web Vitals

```typescript
// Monitoring des Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Envoyer les métriques à votre service d'analytics
  console.log('Web Vital:', metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 🚀 Optimisations de Déploiement

### Build Optimizations

```typescript
// Configuration Vite optimisée
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### CDN et Caching

```typescript
// Configuration des headers de cache
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'ETag': generateETag(content)
};

// Service Worker pour le cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
```

## 📈 Benchmarks et Tests

### Tests de Performance

```typescript
// Tests de performance avec Jest
describe('Performance Tests', () => {
  it('should load producers list in less than 500ms', async () => {
    const start = performance.now();
    
    await render(<ProducersList />);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
  
  it('should handle large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Producer ${i}`
    }));
    
    const start = performance.now();
    
    render(<ProducersList producers={largeDataset} />);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

### Profiling en Production

```typescript
// Profiling conditionnel
if (process.env.NODE_ENV === 'production') {
  // Activer le profiling en production
  const { Profiler } = require('react');
  
  const onRenderCallback = (id, phase, actualDuration) => {
    if (actualDuration > 100) { // Log les rendus lents
      console.warn(`Slow render: ${id} - ${actualDuration}ms`);
    }
  };
  
  // Wrapper pour les composants critiques
  const withProfiler = (Component) => (props) => (
    <Profiler id={Component.name} onRender={onRenderCallback}>
      <Component {...props} />
    </Profiler>
  );
}
```

## 📚 Ressources

- [React Performance](https://react.dev/learn/render-and-commit)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Web Vitals](https://web.dev/vitals/)
- [Supabase Performance](https://supabase.com/docs/guides/performance)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
