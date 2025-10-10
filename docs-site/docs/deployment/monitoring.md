# 📊 Monitoring et Surveillance

Configuration du monitoring et de la surveillance pour AgriConnect.

## 🎯 Vue d'ensemble

Ce guide couvre la configuration du monitoring, des alertes et de la surveillance pour tous les composants d'AgriConnect.

## 🔍 Monitoring des Applications

### 1. Monitoring Web (Vercel)

```typescript
// Configuration des métriques
const metrics = {
  // Temps de réponse
  responseTime: {
    target: 500, // ms
    warning: 1000, // ms
    critical: 2000 // ms
  },
  
  // Taux d'erreur
  errorRate: {
    target: 0.1, // 0.1%
    warning: 1, // 1%
    critical: 5 // 5%
  },
  
  // Disponibilité
  availability: {
    target: 99.9, // 99.9%
    warning: 99.5, // 99.5%
    critical: 99 // 99%
  }
};
```

### 2. Monitoring Mobile (Expo)

```typescript
// Configuration des métriques mobiles
const mobileMetrics = {
  // Temps de lancement
  launchTime: {
    target: 3000, // ms
    warning: 5000, // ms
    critical: 10000 // ms
  },
  
  // Taux de crash
  crashRate: {
    target: 0.1, // 0.1%
    warning: 1, // 1%
    critical: 5 // 5%
  },
  
  // Utilisation de la mémoire
  memoryUsage: {
    target: 100, // MB
    warning: 200, // MB
    critical: 500 // MB
  }
};
```

## 🗄️ Monitoring de la Base de Données

### 1. Métriques Supabase

```sql
-- Requêtes lentes
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
WHERE mean_time > 1000 -- Plus de 1 seconde
ORDER BY mean_time DESC
LIMIT 10;

-- Utilisation de l'espace disque
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Connexions actives
SELECT 
  count(*) as active_connections,
  state
FROM pg_stat_activity
GROUP BY state;
```

### 2. Monitoring PostGIS

```sql
-- Requêtes spatiales lentes
SELECT 
  query,
  mean_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%ST_%'
  AND mean_time > 500
ORDER BY mean_time DESC;

-- Utilisation des index spatiaux
SELECT 
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexdef LIKE '%GIST%'
ORDER BY idx_tup_read DESC;
```

## 🔔 Monitoring des Notifications

### 1. Métriques Twilio

```typescript
// Configuration des métriques SMS
const smsMetrics = {
  // Taux de livraison
  deliveryRate: {
    target: 95, // 95%
    warning: 90, // 90%
    critical: 85 // 85%
  },
  
  // Temps de livraison
  deliveryTime: {
    target: 30, // secondes
    warning: 60, // secondes
    critical: 120 // secondes
  },
  
  // Taux d'erreur
  errorRate: {
    target: 1, // 1%
    warning: 5, // 5%
    critical: 10 // 10%
  }
};

// Monitoring des SMS
const monitorSMS = async () => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const messages = await client.messages.list({ limit: 100 });
    
    const metrics = {
      total: messages.length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length
    };
    
    const deliveryRate = (metrics.delivered / metrics.total) * 100;
    
    if (deliveryRate < smsMetrics.deliveryRate.warning) {
      console.warn(`SMS delivery rate low: ${deliveryRate}%`);
    }
    
    return metrics;
  } catch (error) {
    console.error('SMS monitoring error:', error);
  }
};
```

### 2. Monitoring des Push Notifications

```typescript
// Configuration des métriques push
const pushMetrics = {
  // Taux de livraison
  deliveryRate: {
    target: 90, // 90%
    warning: 80, // 80%
    critical: 70 // 70%
  },
  
  // Taux d'ouverture
  openRate: {
    target: 20, // 20%
    warning: 15, // 15%
    critical: 10 // 10%
  }
};

// Monitoring des push notifications
const monitorPush = async () => {
  try {
    const receipts = await Notifications.getPushNotificationReceiptsAsync();
    
    const metrics = {
      total: receipts.length,
      delivered: receipts.filter(r => r.status === 'ok').length,
      failed: receipts.filter(r => r.status === 'error').length
    };
    
    const deliveryRate = (metrics.delivered / metrics.total) * 100;
    
    if (deliveryRate < pushMetrics.deliveryRate.warning) {
      console.warn(`Push delivery rate low: ${deliveryRate}%`);
    }
    
    return metrics;
  } catch (error) {
    console.error('Push monitoring error:', error);
  }
};
```

## 📊 Collecte de Métriques

### 1. Métriques d'Application

```typescript
// Service de collecte de métriques
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
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
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
```

### 2. Métriques de Performance

```typescript
// Monitoring des performances
const performanceMonitor = {
  // Temps de réponse API
  apiResponseTime: (endpoint: string, duration: number) => {
    console.log(`API ${endpoint}: ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`Slow API response: ${endpoint} - ${duration}ms`);
    }
  },
  
  // Utilisation de la mémoire
  memoryUsage: () => {
    const usage = process.memoryUsage();
    console.log('Memory usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
    });
  },
  
  // Temps de rendu
  renderTime: (component: string, duration: number) => {
    console.log(`Render ${component}: ${duration}ms`);
    
    if (duration > 100) {
      console.warn(`Slow render: ${component} - ${duration}ms`);
    }
  }
};
```

## 🚨 Configuration des Alertes

### 1. Alertes de Base

```typescript
// Configuration des alertes
const alerts = {
  // Alertes de performance
  performance: {
    slowResponse: {
      threshold: 2000, // ms
      action: 'warn'
    },
    highMemoryUsage: {
      threshold: 500, // MB
      action: 'critical'
    }
  },
  
  // Alertes de disponibilité
  availability: {
    serviceDown: {
      threshold: 0, // 0% de disponibilité
      action: 'critical'
    },
    highErrorRate: {
      threshold: 5, // 5% d'erreurs
      action: 'warn'
    }
  },
  
  // Alertes de sécurité
  security: {
    failedLogins: {
      threshold: 10, // 10 tentatives échouées
      action: 'warn'
    },
    suspiciousActivity: {
      threshold: 1, // 1 activité suspecte
      action: 'critical'
    }
  }
};
```

### 2. Envoi d'Alertes

```typescript
// Service d'alertes
class AlertService {
  async sendAlert(level: 'info' | 'warn' | 'critical', message: string, data?: any) {
    const alert = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      service: 'agriconnect'
    };
    
    // Envoyer par email
    if (level === 'critical') {
      await this.sendEmail(alert);
    }
    
    // Envoyer par SMS
    if (level === 'critical') {
      await this.sendSMS(alert);
    }
    
    // Envoyer par webhook
    await this.sendWebhook(alert);
    
    console.log('Alert sent:', alert);
  }
  
  private async sendEmail(alert: any) {
    // Implémentation de l'envoi d'email
  }
  
  private async sendSMS(alert: any) {
    // Implémentation de l'envoi de SMS
  }
  
  private async sendWebhook(alert: any) {
    // Implémentation de l'envoi de webhook
  }
}

// Utilisation
const alertService = new AlertService();

// Envoyer une alerte
if (errorRate > 5) {
  await alertService.sendAlert('warn', 'High error rate detected', { errorRate });
}
```

## 📈 Tableaux de Bord

### 1. Dashboard de Monitoring

```typescript
// Composant de dashboard
const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Temps de réponse"
        value={`${metrics?.responseTime?.avg || 0}ms`}
        status={metrics?.responseTime?.avg < 500 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Taux d'erreur"
        value={`${metrics?.errorRate || 0}%`}
        status={metrics?.errorRate < 1 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Disponibilité"
        value={`${metrics?.availability || 0}%`}
        status={metrics?.availability > 99.5 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Utilisateurs actifs"
        value={metrics?.activeUsers || 0}
        status="good"
      />
    </div>
  );
};
```

### 2. Graphiques de Performance

```typescript
// Composant de graphique
const PerformanceChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="responseTime" stroke="#8884d8" />
        <Line type="monotone" dataKey="errorRate" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

## 🔍 Logs et Debugging

### 1. Configuration des Logs

```typescript
// Configuration des logs
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};
```

### 2. Logs Structurés

```typescript
// Logs structurés
const structuredLogger = {
  log: (level: string, message: string, context: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: 'agriconnect',
      version: process.env.APP_VERSION
    };
    
    console.log(JSON.stringify(logEntry));
  }
};
```

## 📚 Ressources

- [Documentation Vercel Analytics](https://vercel.com/docs/analytics)
- [Documentation Supabase Monitoring](https://supabase.com/docs/guides/platform/logs)
- [Documentation Sentry](https://docs.sentry.io/)
- [Documentation Twilio Monitoring](https://www.twilio.com/docs/monitor)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
