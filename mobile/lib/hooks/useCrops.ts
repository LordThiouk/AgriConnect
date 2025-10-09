/**
 * Hook personnalisé pour la gestion des cultures avec cache intelligent
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CropsServiceInstance as CropsService } from '../services/domain/crops';
import { Crop, CropFilters, CropSort, CropServiceOptions } from '../services/domain/crops/crops.types';
import { useFocusEffect } from 'expo-router';
import cacheService from '../services/cache';

interface UseCropsOptions extends CropServiceOptions {
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (crops: Crop[]) => void;
  enabled?: boolean;
}

interface UseCropsReturn {
  crops: Crop[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidateCache: () => Promise<void>;
  updateFilters: (filters: CropFilters) => void;
  updateSort: (sort: CropSort) => void;
}

/**
 * Hook pour récupérer les cultures d'une parcelle avec cache intelligent
 */
export const useCrops = (
  plotId: string,
  agentId?: string,
  options: UseCropsOptions = {}
): UseCropsReturn => {
  const {
    useCache = true,
    cacheTTL,
    refreshCache = false,
    refetchOnMount = true,
    refetchInterval,
    onError,
    onSuccess,
    enabled = true,
    ...cropFilters
  } = options;

  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(enabled && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<CropFilters | undefined>(cropFilters);
  const [sort, setSort] = useState<CropSort | undefined>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCrops = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Tenter de récupérer depuis le cache d'abord
      if (useCache && !refreshCache) {
        const cacheKey = `crops:${plotId}:${JSON.stringify(filters)}:${sort}`;
        const cachedCrops = cacheService.get<Crop[]>(cacheKey);
        if (cachedCrops) {
          console.log(`🌿 [Cache] Cultures pour la parcelle ${plotId} récupérées depuis le cache.`);
          setCrops(cachedCrops);
          setLoading(false);
          onSuccess?.(cachedCrops);
          return;
        }
      }

      const fetchedCrops = await CropsService.getCropsByPlotId(
        plotId,
        agentId,
        filters,
        sort,
        {
          useCache,
          cacheTTL,
          refreshCache
        }
      );

      if (!abortControllerRef.current.signal.aborted) {
        setCrops(fetchedCrops);
        onSuccess?.(fetchedCrops);
      }
    } catch (err: any) {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [plotId, agentId, filters, sort, useCache, cacheTTL, refreshCache, onError, onSuccess, enabled, loading]);

  const refetch = useCallback(async () => {
    await fetchCrops();
  }, [fetchCrops]);

  const invalidateCache = useCallback(async () => {
    await CropsService.invalidatePlotCache(plotId);
    await refetch();
  }, [plotId, refetch]);

  const updateFilters = useCallback((newFilters: CropFilters) => {
    setFilters(newFilters);
  }, []);

  const updateSort = useCallback((newSort: CropSort) => {
    setSort(newSort);
  }, []);

  // Effet pour le chargement initial
  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchCrops();
    }
  }, [fetchCrops, refetchOnMount, plotId, enabled]);

  // Effet pour le refetch automatique
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        fetchCrops();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchCrops, refetchInterval, enabled]);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    crops,
    loading,
    error,
    refetch,
    invalidateCache,
    updateFilters,
    updateSort
  };
};

interface UseCropOptions extends CropServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (crop: Crop | null) => void;
  enabled?: boolean;
}

interface UseCropReturn {
  crop: Crop | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidateCache: () => Promise<void>;
}

/**
 * Hook pour récupérer une culture spécifique avec cache intelligent
 */
export const useCrop = (
  cropId: string,
  agentId?: string,
  options: UseCropOptions = {}
): UseCropReturn => {
  const {
    useCache = true,
    cacheTTL,
    refreshCache = false,
    refetchOnMount = true,
    onError,
    onSuccess,
    enabled = true,
  } = options;

  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(enabled && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCrop = useCallback(async () => {
    if (!cropId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Tenter de récupérer depuis le cache d'abord
      if (useCache && !refreshCache) {
        const cacheKey = `crop:${cropId}`;
        const cachedCrop = cacheService.get<Crop>(cacheKey);
        if (cachedCrop) {
          console.log(`🌿 [Cache] Culture ${cropId} récupérée depuis le cache.`);
          setCrop(cachedCrop);
          setLoading(false);
          onSuccess?.(cachedCrop);
          return;
        }
      }

      // Note: CropsService n'a pas de méthode getCropById, on utilise getCropsByPlotId
      // et on filtre par cropId. Dans un vrai service, on aurait une méthode dédiée.
      const crops = await CropsService.getCropsByPlotId('', agentId, { crop_id: cropId }, undefined, {
        useCache,
        cacheTTL,
        refreshCache
      });

      if (!abortControllerRef.current.signal.aborted) {
        const foundCrop = crops.find(c => c.id === cropId) || null;
        setCrop(foundCrop);
        onSuccess?.(foundCrop);
      }
    } catch (err: any) {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [cropId, agentId, useCache, cacheTTL, refreshCache, onError, onSuccess, enabled, loading]);

  const refetch = useCallback(async () => {
    await fetchCrop();
  }, [fetchCrop]);

  const invalidateCache = useCallback(async () => {
    await CropsService.invalidateCropCache(cropId);
    await refetch();
  }, [cropId, refetch]);

  // Effet pour le chargement initial
  useEffect(() => {
    if (refetchOnMount && cropId && enabled) {
      fetchCrop();
    }
  }, [fetchCrop, refetchOnMount, cropId, enabled]);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    crop,
    loading,
    error,
    refetch,
    invalidateCache
  };
};

interface UseActiveCropOptions extends CropServiceOptions {
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (crop: Crop | null) => void;
  enabled?: boolean;
}

interface UseActiveCropReturn {
  crop: Crop | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidateCache: () => Promise<void>;
}

/**
 * Hook pour récupérer la culture active d'une parcelle avec cache intelligent
 */
export const useActiveCrop = (
  plotId: string,
  options: UseActiveCropOptions = {}
): UseActiveCropReturn => {
  const {
    useCache = true,
    cacheTTL,
    refreshCache = false,
    refetchOnMount = true,
    refetchInterval,
    onError,
    onSuccess,
    enabled = true,
  } = options;

  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(enabled && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchActiveCrop = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `active_crop:${plotId}`;

      // Tenter de récupérer depuis le cache d'abord
      if (useCache && !refreshCache) {
        const cachedCrop = cacheService.get<Crop>(cacheKey);
        if (cachedCrop) {
          console.log(`🌿 [Cache] Culture active pour la parcelle ${plotId} récupérée depuis le cache.`);
          setCrop(cachedCrop);
          setLoading(false);
          onSuccess?.(cachedCrop);
          return;
        }
      }

      console.log(`🔄 [useActiveCrop] Récupération de la culture active pour la parcelle ${plotId}`);

      const activeCrop = await CropsService.getActiveCropByPlotId(
        plotId,
        {
          useCache,
          cacheTTL,
          refreshCache
        }
      );

      setCrop(activeCrop);

      // Mettre en cache le résultat
      if (useCache) {
        cacheService.set(cacheKey, activeCrop, cacheTTL);
        console.log(`🌿 [Cache] Culture active pour la parcelle ${plotId} mise en cache.`);
      }

      onSuccess?.(activeCrop);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        onError?.(error);
        console.error('❌ [useActiveCrop] Erreur:', error);
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [plotId, useCache, cacheTTL, refreshCache, onError, onSuccess, enabled, loading]);

  const refetch = useCallback(async () => {
    await fetchActiveCrop();
  }, [fetchActiveCrop]);

  const invalidateCache = useCallback(async () => {
    await CropsService.invalidatePlotCache(plotId);
    await refetch();
  }, [plotId, refetch]);

  // Effet pour le chargement initial
  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchActiveCrop();
    }
  }, [fetchActiveCrop, refetchOnMount, plotId, enabled]);

  // Effet pour le refetch automatique
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        fetchActiveCrop();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchActiveCrop, refetchInterval, enabled]);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    crop,
    loading,
    error,
    refetch,
    invalidateCache
  };
};
