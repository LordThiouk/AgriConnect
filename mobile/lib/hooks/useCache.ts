/**
 * Hook personnalisé pour utiliser le cache AgriConnect
 * Simplifie l'utilisation du cache dans les composants
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { agriConnectCache, CacheKeys } from '../services/core';
import { CacheTTL, CacheKey } from '../lib/types/core/core';

interface UseCacheOptions {
  ttl?: CacheTTL;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  setData: (data: T) => Promise<void>;
}

/**
 * Hook pour récupérer des données depuis le cache
 */
export function useCache<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const {
    ttl = 'medium',
    enabled = true,
    refetchOnMount = false,
    refetchInterval,
    onError,
    onSuccess,
  } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (force = false) => {
    console.log(`🔄 [useCache] fetchData called for key: ${key}, enabled: ${enabled}, force: ${force}`);
    if (!enabled) {
      console.log(`⏭️ [useCache] Skipping fetch - disabled for key: ${key}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache d'abord
      if (!force) {
        const cachedData = await agriConnectCache.get<T>(key);
        if (cachedData) {
          // Éviter de figer des listes vides: forcer un refresh si tableau vide
          if (Array.isArray(cachedData) && cachedData.length === 0) {
            console.log(`⚠️ [useCache] Empty array in cache for key: ${key} → fetching fresh`);
          } else {
            console.log(`⚡ [useCache] Cache HIT for key: ${key}`, cachedData);
            setDataState(cachedData);
            setLoading(false);
            onSuccess?.(cachedData);
            return;
          }
        } else {
          console.log(`❌ [useCache] Cache MISS for key: ${key}`);
        }
      }

      // Récupérer depuis l'API
      console.log(`🚀 [useCache] Fetching fresh data for key: ${key}`);
      const freshData = await fetcher();
      
      // Mettre en cache
      await agriConnectCache.set(key, freshData, ttl);
      
      setDataState(freshData);
      onSuccess?.(freshData);
      console.log(`✅ [useCache] Fresh data fetched and cached for key: ${key}`);

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error(`❌ [useCache] Erreur pour ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [key, ttl, enabled, onError, onSuccess]); // Retiré fetcher des dépendances

  const refetch = useCallback(() => fetchData(true), [fetchData]);
  
  const invalidate = useCallback(async () => {
    await agriConnectCache.delete(key);
    setDataState(null);
  }, [key]);

  const setData = useCallback(async (newData: T) => {
    await agriConnectCache.set(key, newData, ttl);
    setDataState(newData);
  }, [key, ttl]);

  // Effet initial
  useEffect(() => {
    console.log(`🔄 [useCache] Effect triggered for key: ${key}, enabled: ${enabled}`);
    if (enabled) {
      fetchData();
    }
  }, [key, enabled]); // Retiré fetchData des dépendances

  // Refetch au montage si demandé
  useEffect(() => {
    if (refetchOnMount && enabled) {
      fetchData(true);
    }
  }, [refetchOnMount, enabled]); // Retiré fetchData des dépendances

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled]); // Retiré fetchData des dépendances

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    setData,
  };
}

/**
 * Hook pour les données de parcelles avec cache automatique
 */
export function usePlotsCache(agentId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.plots(agentId);
  
  const fetcher = useCallback(async () => {
    // Cette fonction sera remplacée par l'API client
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getPlots(agentId);
  }, [agentId]);

  return useCache(key, fetcher, {
    ttl: 'long', // Les parcelles changent rarement
    ...options,
  });
}

/**
 * Hook pour les données d'une parcelle avec cache automatique
 */
export function usePlotCache(plotId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.plot(plotId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getPlot(plotId);
  }, [plotId]);

  return useCache(key, fetcher, {
    ttl: 'medium',
    ...options,
  });
}

/**
 * Hook pour les cultures d'une parcelle avec cache automatique
 */
export function useCropsCache(plotId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.crops(plotId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getCrops(plotId);
  }, [plotId]);

  return useCache(key, fetcher, {
    ttl: 'medium',
    ...options,
  });
}

/**
 * Hook pour les opérations d'une parcelle avec cache automatique
 */
export function useOperationsCache(plotId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.operations(plotId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getOperations(plotId);
  }, [plotId]);

  return useCache(key, fetcher, {
    ttl: 'short', // Les opérations changent plus fréquemment
    ...options,
  });
}

/**
 * Hook pour les observations d'une parcelle avec cache automatique
 */
export function useObservationsCache(plotId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.observations(plotId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getObservations(plotId);
  }, [plotId]);

  return useCache(key, fetcher, {
    ttl: 'short',
    ...options,
  });
}

/**
 * Hook pour les médias d'une entité avec cache automatique
 */
export function useMediaCache(entityType: string, entityId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.media(entityType, entityId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getMedia(entityType, entityId);
  }, [entityType, entityId]);

  return useCache(key, fetcher, {
    ttl: 'long', // Les médias changent rarement
    ...options,
  });
}

/**
 * Hook pour les visites d'un agent avec cache automatique
 */
export function useVisitsCache(agentId: string, filter?: string, options: UseCacheOptions = {}) {
  const key = `${CacheKeys.visits(agentId)}:${filter || 'all'}`;
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getVisits(agentId, filter);
  }, [agentId, filter]);

  return useCache(key, fetcher, {
    ttl: 'short', // Les visites changent fréquemment
    ...options,
  });
}

/**
 * Hook pour le dashboard d'un agent avec cache automatique
 */
export function useDashboardCache(agentId: string, options: UseCacheOptions = {}) {
  const key = CacheKeys.dashboard(agentId);
  
  const fetcher = useCallback(async () => {
    const { agriConnectApi } = await import('../services/core');
    return agriConnectApi.getDashboard(agentId);
  }, [agentId]);

  return useCache(key, fetcher, {
    ttl: 'medium',
    ...options,
  });
}

/**
 * Hook pour invalider le cache par pattern
 */
export function useCacheInvalidation() {
  const invalidate = useCallback(async (pattern: string) => {
    return agriConnectCache.invalidate({ pattern });
  }, []);

  const invalidateAll = useCallback(async () => {
    return agriConnectCache.clear();
  }, []);

  return {
    invalidate,
    invalidateAll,
  };
}

/**
 * Hook pour les statistiques du cache
 */
export function useCacheStats() {
  const [stats, setStats] = useState(agriConnectCache.getStats());
  const [metrics, setMetrics] = useState(agriConnectCache.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(agriConnectCache.getStats());
      setMetrics(agriConnectCache.getMetrics());
    }, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return { stats, metrics };
}
