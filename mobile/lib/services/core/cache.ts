/**
 * Système de cache intelligent AgriConnect
 * Résout les requêtes répétitives visibles dans les logs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CacheEntry, 
  CacheConfig, 
  CacheMetrics, 
  CacheInvalidationOptions,
  CacheKey,
  CacheTTL,
  DEFAULT_CACHE_CONFIG,
  TTL_MAPPING,
  CacheEvent,
  CacheEventListener,
  CacheStats
} from '../../types/core';

class AgriConnectCache {
  private memory: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private listeners: CacheEventListener[] = [];
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memorySize: 0,
      storageSize: 0,
      hitRate: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Initialise le cache en chargeant les données depuis AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('agri_cache:'));
      
      // Charger les métadonnées du cache
      const metadataKey = 'agri_cache:metadata';
      const metadata = await AsyncStorage.getItem(metadataKey);
      
      if (metadata) {
        const parsedMetadata = JSON.parse(metadata);
        this.metrics = { ...this.metrics, ...parsedMetadata.metrics };
      }

      // Nettoyer les entrées expirées
      await this.cleanupExpiredEntries();

      this.isInitialized = true;
      console.log('✅ [CACHE] Initialisé avec', cacheKeys.length, 'entrées');
    } catch (error) {
      console.error('❌ [CACHE] Erreur lors de l\'initialisation:', error);
    }
  }

  /**
   * Récupère une valeur depuis le cache (mémoire → AsyncStorage → null)
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    const startTime = Date.now();
    
    // S'assurer que le cache est initialisé
    if (!this.isInitialized) {
      console.warn('⚠️ [CACHE] Cache non initialisé, initialisation automatique...');
      await this.initialize();
    }
    
    try {
      // 1. Vérifier le cache mémoire
      const memoryEntry = this.memory.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.metrics.hits++;
        this.updateHitRate();
        this.emitEvent('hit', key, Date.now() - startTime);
        return memoryEntry.data;
      }

      // 2. Vérifier le cache AsyncStorage
      const storageKey = `agri_cache:${key}`;
      const storageData = await AsyncStorage.getItem(storageKey);
      
      if (storageData) {
        const entry: CacheEntry<T> = JSON.parse(storageData);
        
        if (!this.isExpired(entry)) {
          // Remettre en cache mémoire
          this.memory.set(key, entry);
          this.metrics.hits++;
          this.updateHitRate();
          this.emitEvent('hit', key, Date.now() - startTime);
          return entry.data;
        } else {
          // Nettoyer l'entrée expirée
          await this.delete(key);
        }
      }

      // 3. Cache miss
      this.metrics.misses++;
      this.updateHitRate();
      this.emitEvent('miss', key, Date.now() - startTime);
      return null;

    } catch (error) {
      console.error('❌ [CACHE] Erreur lors de la récupération:', error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache (mémoire + AsyncStorage)
   */
  async set<T>(
    key: CacheKey, 
    data: T, 
    ttl: CacheTTL = 'medium',
    tags?: string[]
  ): Promise<void> {
    const startTime = Date.now();
    
    // S'assurer que le cache est initialisé
    if (!this.isInitialized) {
      console.warn('⚠️ [CACHE] Cache non initialisé, initialisation automatique...');
      await this.initialize();
    }
    
    try {
      const ttlValue = typeof ttl === 'number' ? ttl : TTL_MAPPING[ttl];
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlValue,
        key,
        tags,
        size: this.calculateSize(data),
      };

      // Stocker en mémoire
      this.memory.set(key, entry);
      
      // Stocker en AsyncStorage
      const storageKey = `agri_cache:${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));

      this.metrics.sets++;
      this.emitEvent('set', key, Date.now() - startTime, entry.size);

      // Nettoyer si nécessaire
      await this.cleanupIfNeeded();

    } catch (error) {
      console.error('❌ [CACHE] Erreur lors du stockage:', error);
    }
  }

  /**
   * Supprime une entrée du cache
   */
  async delete(key: CacheKey): Promise<boolean> {
    try {
      // Supprimer de la mémoire
      this.memory.delete(key);

      // Supprimer d'AsyncStorage
      const storageKey = `agri_cache:${key}`;
      await AsyncStorage.removeItem(storageKey);

      this.metrics.deletes++;
      this.emitEvent('delete', key);

      return true;
    } catch (error) {
      console.error('❌ [CACHE] Erreur lors de la suppression:', error);
      return false;
    }
  }

  /**
   * Invalide les entrées selon un pattern (méthode de compatibilité)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return this.invalidate({ pattern });
  }

  /**
   * Invalide les entrées selon un pattern
   */
  async invalidate(options: CacheInvalidationOptions): Promise<number> {
    let invalidatedCount = 0;

    try {
      if (options.pattern) {
        const regex = new RegExp(options.pattern.replace(/\*/g, '.*'));
        
        // Invalider le cache mémoire
        for (const [key] of this.memory) {
          if (regex.test(key)) {
            const entry = this.memory.get(key);
            if (entry && (!options.before || entry.timestamp < options.before)) {
              this.memory.delete(key);
              invalidatedCount++;
            }
          }
        }

        // Invalider le cache AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('agri_cache:'));
        
        for (const cacheKey of cacheKeys) {
          const key = cacheKey.replace('agri_cache:', '');
          if (regex.test(key)) {
            const data = await AsyncStorage.getItem(cacheKey);
            if (data) {
              const entry: CacheEntry = JSON.parse(data);
              if (!options.before || entry.timestamp < options.before) {
                await AsyncStorage.removeItem(cacheKey);
                invalidatedCount++;
              }
            }
          }
        }
      }

      if (options.tags) {
        // Invalidation par tags (à implémenter si nécessaire)
      }

      if (invalidatedCount > 0) {
        this.emitEvent('invalidate', '', undefined, invalidatedCount);
      }

    } catch (error) {
      console.error('❌ [CACHE] Erreur lors de l\'invalidation:', error);
    }

    return invalidatedCount;
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    const memoryKeys = Array.from(this.memory.keys());
    const expiredKeys = memoryKeys.filter(key => {
      const entry = this.memory.get(key);
      return entry ? this.isExpired(entry) : false;
    });

    const timestamps = memoryKeys.map(key => {
      const entry = this.memory.get(key);
      return entry?.timestamp || 0;
    }).filter(ts => ts > 0);

    return {
      totalKeys: memoryKeys.length,
      expiredKeys: expiredKeys.length,
      memoryKeys: memoryKeys.length,
      storageKeys: 0, // Sera calculé si nécessaire
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * Récupère les métriques de performance
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Vide complètement le cache
   */
  async clear(): Promise<void> {
    try {
      // Vider la mémoire
      this.memory.clear();

      // Vider AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('agri_cache:'));
      await AsyncStorage.multiRemove(cacheKeys);

      // Reset des métriques
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        memorySize: 0,
        storageSize: 0,
        hitRate: 0,
        averageResponseTime: 0,
      };

      console.log('✅ [CACHE] Cache vidé complètement');
    } catch (error) {
      console.error('❌ [CACHE] Erreur lors du vidage:', error);
    }
  }

  /**
   * Ajoute un listener pour les événements de cache
   */
  addEventListener(listener: CacheEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Supprime un listener
   */
  removeEventListener(listener: CacheEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Méthodes privées

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private emitEvent(
    type: CacheEvent['type'], 
    key: string, 
    responseTime?: number, 
    size?: number
  ): void {
    if (!this.config.enableMetrics) return;

    const event: CacheEvent = {
      type,
      key,
      timestamp: Date.now(),
      responseTime,
      size,
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ [CACHE] Erreur dans le listener:', error);
      }
    });
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const expiredKeys: string[] = [];

    // Nettoyer la mémoire
    for (const [key, entry] of this.memory) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    // Nettoyer AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('agri_cache:'));
    
    for (const cacheKey of cacheKeys) {
      try {
        const data = await AsyncStorage.getItem(cacheKey);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          if (this.isExpired(entry)) {
            await AsyncStorage.removeItem(cacheKey);
          }
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }

    // Supprimer de la mémoire
    expiredKeys.forEach(key => this.memory.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 [CACHE] ${expiredKeys.length} entrées expirées nettoyées`);
    }
  }

  private async cleanupIfNeeded(): Promise<void> {
    // Nettoyer la mémoire si trop d'entrées
    if (this.memory.size > this.config.maxMemoryEntries) {
      const entries = Array.from(this.memory.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp); // Plus ancien en premier

      const toRemove = entries.slice(0, this.memory.size - this.config.maxMemoryEntries);
      
      for (const [key] of toRemove) {
        this.memory.delete(key);
      }

      console.log(`🧹 [CACHE] ${toRemove.length} entrées mémoire supprimées (limite atteinte)`);
    }
  }
}

// Instance singleton
export const agriConnectCache = new AgriConnectCache();

// Fonctions utilitaires pour les patterns de cache AgriConnect
export const CacheKeys = {
  // Clés simples
  plot: (plotId: string) => `plot:${plotId}`,
  crops: (plotId: string) => `crops:plot:${plotId}`,
  operations: (plotId: string) => `operations:plot:${plotId}`,
  observations: (plotId: string) => `observations:plot:${plotId}`,
  media: (entityType: string, entityId: string) => `media:${entityType}:${entityId}`,
  visits: (agentId: string) => `visits:agent:${agentId}`,
  dashboard: (agentId: string) => `dashboard:agent:${agentId}`,
  intrants: (plotId: string) => `intrants:plot:${plotId}`,
  
  // Clés complexes pour les services refactorisés
  alerts: {
    agent: (agentId: string, filters?: any) => `alerts:agent:${agentId}:${JSON.stringify(filters || {})}`,
    stats: (agentId: string) => `alerts:stats:${agentId}`,
  },
  producers: {
    agent: (agentId: string, filters?: any) => `producers:agent:${agentId}:${JSON.stringify(filters || {})}`,
    byId: (producerId: string) => `producers:${producerId}`,
    stats: (agentId: string) => `producers:stats:${agentId}`,
  },
  plots: {
    agent: (agentId: string, filters?: any) => `plots:agent:${agentId}:${JSON.stringify(filters || {})}`,
    byId: (plotId: string) => `plots:${plotId}`,
    byProducer: (producerId: string) => `plots:producer:${producerId}`,
    stats: (agentId: string) => `plots:stats:${agentId}`,
  },
} as const;

export default agriConnectCache;
