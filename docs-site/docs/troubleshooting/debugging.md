# 🐛 Guide de Debugging

Techniques et outils pour diagnostiquer et résoudre les problèmes dans AgriConnect.

## 🔍 Outils de Debugging

### Console et Logs

```typescript
// Logs structurés
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }
};

// Utilisation
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', error);
```

### Debugging React

```typescript
// React Developer Tools
import { useEffect } from 'react';

// Hook de debugging
const useDebug = (value: any, label: string) => {
  useEffect(() => {
    console.log(`[DEBUG] ${label}:`, value);
  }, [value, label]);
};

// Utilisation
const MyComponent = ({ data }) => {
  useDebug(data, 'Component data');
  return <div>{/* ... */}</div>;
};
```

### Debugging Supabase

```typescript
// Configuration de debug
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: true
    }
  }
);

// Logs des requêtes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

## 🗄️ Debugging Base de Données

### Requêtes SQL

```sql
-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'producers';

-- Vérifier les permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'producers';

-- Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'producers';
```

### Debugging PostGIS

```sql
-- Vérifier les géométries
SELECT 
  id,
  ST_IsValid(geom) as is_valid,
  ST_IsValidReason(geom) as reason
FROM plots 
WHERE NOT ST_IsValid(geom);

-- Vérifier le SRID
SELECT 
  id,
  ST_SRID(geom) as srid,
  ST_AsText(geom) as wkt
FROM plots 
LIMIT 5;

-- Vérifier les index spatiaux
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'plots' 
AND indexdef LIKE '%GIST%';
```

## 📱 Debugging Mobile

### React Native Debugger

```typescript
// Configuration du debugger
import { LogBox } from 'react-native';

// Ignorer les warnings non critiques
LogBox.ignoreLogs([
  'Warning: ...',
  'Non-serializable values were found in the navigation state'
]);

// Debug des performances
import { enableScreens } from 'react-native-screens';
enableScreens();
```

### Debugging Expo

```bash
# Mode debug
npx expo start --dev-client

# Logs en temps réel
npx expo logs

# Debug des permissions
npx expo install expo-device
```

### Debugging des Permissions

```typescript
// Vérifier les permissions
import * as Permissions from 'expo-permissions';

const checkPermissions = async () => {
  const { status: cameraStatus } = await Permissions.askAsync(Permissions.CAMERA);
  const { status: locationStatus } = await Permissions.askAsync(Permissions.LOCATION);
  
  console.log('Camera permission:', cameraStatus);
  console.log('Location permission:', locationStatus);
};
```

## 🌐 Debugging Web

### Chrome DevTools

```typescript
// Breakpoints conditionnels
if (user.role === 'admin') {
  debugger; // S'arrêtera seulement pour les admins
}

// Profiling des performances
console.time('API Call');
await fetchProducers();
console.timeEnd('API Call');

// Monitoring des erreurs
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Envoyer à un service de monitoring
});
```

### Debugging React Query

```typescript
// Configuration de debug
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error);
      },
      onSuccess: (data) => {
        console.log('Query success:', data);
      }
    }
  }
});

// Debug des mutations
const mutation = useMutation({
  mutationFn: createProducer,
  onError: (error) => {
    console.error('Mutation error:', error);
  },
  onSuccess: (data) => {
    console.log('Mutation success:', data);
  }
});
```

## 🔔 Debugging des Notifications

### Debugging Twilio

```typescript
// Logs des SMS
const sendSMS = async (phone: string, message: string) => {
  try {
    console.log('Sending SMS to:', phone);
    console.log('Message:', message);
    
    const result = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    console.log('SMS sent successfully:', result.sid);
    return result;
  } catch (error) {
    console.error('SMS failed:', error);
    throw error;
  }
};
```

### Debugging Push Notifications

```typescript
// Vérifier les tokens
const checkPushToken = async () => {
  const token = await Notifications.getExpoPushTokenAsync();
  console.log('Push token:', token);
  
  // Vérifier les permissions
  const { status } = await Notifications.getPermissionsAsync();
  console.log('Notification permission:', status);
};
```

## 🚀 Debugging de Performance

### Profiling React

```typescript
// Profiler React
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Render:', { id, phase, actualDuration });
};

<Profiler id="ProducerList" onRender={onRenderCallback}>
  <ProducerList />
</Profiler>
```

### Monitoring des Requêtes

```typescript
// Intercepteur de requêtes
const apiClient = axios.create({
  baseURL: process.env.SUPABASE_URL
});

apiClient.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);
```

## 🔍 Outils de Monitoring

### Sentry Integration

```typescript
import * as Sentry from '@sentry/react-native';

// Configuration Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filtrer les erreurs non critiques
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'NetworkError') {
        return null; // Ignorer les erreurs réseau
      }
    }
    return event;
  }
});

// Capture d'erreurs manuelles
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Logs Structurés

```typescript
// Service de logging
class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      userId: getCurrentUserId(),
      sessionId: getSessionId()
    };
    
    console.log(JSON.stringify(logEntry));
    
    // Envoyer à un service de logging
    if (level === 'error') {
      this.sendToLoggingService(logEntry);
    }
  }
  
  private sendToLoggingService(logEntry: any) {
    // Implémentation de l'envoi vers un service externe
  }
}

// Utilisation
const logger = new Logger('ProducerService');
logger.log('info', 'Producer created', { producerId: '123' });
logger.log('error', 'Failed to create producer', { error: error.message });
```

## 🧪 Tests de Debugging

### Tests de Debugging

```typescript
// Tests de debugging
describe('Debugging Tests', () => {
  it('should log authentication events', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Simuler un événement d'authentification
    simulateAuthEvent('SIGNED_IN', mockUser);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Auth event: SIGNED_IN')
    );
  });
  
  it('should handle database errors gracefully', async () => {
    const errorLogger = jest.fn();
    
    try {
      await createProducer(invalidData);
    } catch (error) {
      errorLogger(error);
    }
    
    expect(errorLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String)
      })
    );
  });
});
```

## 📊 Métriques de Debugging

### Métriques de Performance

```typescript
// Collecte de métriques
class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  
  record(metric: string, value: number) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);
  }
  
  getStats(metric: string) {
    const values = this.metrics.get(metric) || [];
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
const metrics = new MetricsCollector();

// Enregistrer une métrique
const startTime = Date.now();
await fetchProducers();
const duration = Date.now() - startTime;
metrics.record('producers_fetch_duration', duration);

// Obtenir les statistiques
const stats = metrics.getStats('producers_fetch_duration');
console.log('Fetch duration stats:', stats);
```

## 📚 Ressources

- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Supabase Debugging](https://supabase.com/docs/guides/debugging)
- [Expo Debugging](https://docs.expo.dev/debugging/)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
