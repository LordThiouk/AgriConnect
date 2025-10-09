/**
 * Hook pour la gestion des recommandations - AgriConnect
 * Utilise RecommendationsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { RecommendationsServiceInstance } from '../services/domain/recommendations';
import { RecommendationServiceOptions } from '../services/domain/recommendations/recommendations.types';

export interface UseRecommendationsOptions extends RecommendationServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any[]) => void;
  enabled?: boolean;
}

export interface UseRecommendationsResult {
  data: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les recommandations d'une parcelle
 */
export function useRecommendationsByPlot(
  plotId: string,
  options: UseRecommendationsOptions = {}
): UseRecommendationsResult {
  const [data, setData] = useState<any[]>([]);
  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    enabled = true,
    ...serviceOptions
  } = options;
  const [loading, setLoading] = useState(enabled && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useRecommendationsByPlot] Récupération des recommandations pour la parcelle:', plotId);

      const recommendations = await RecommendationsServiceInstance.getRecommendationsByPlotId(
        plotId,
        serviceOptions
      );

      setData(recommendations);
      onSuccess?.(recommendations);

      console.log('✅ [useRecommendationsByPlot] Recommandations récupérées:', recommendations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useRecommendationsByPlot] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, JSON.stringify(serviceOptions), onError, onSuccess, enabled]);

  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchRecommendations();
    }
  }, [fetchRecommendations, refetchOnMount, plotId, enabled]);

  const refetch = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer les dernières recommandations d'une parcelle
 */
export function useLatestRecommendations(
  plotId: string,
  options: UseRecommendationsOptions = {}
): UseRecommendationsResult {
  const [data, setData] = useState<any[]>([]);
  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    enabled = true,
    ...serviceOptions
  } = options;
  const [loading, setLoading] = useState(enabled && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const fetchLatestRecommendations = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useLatestRecommendations] Récupération des dernières recommandations pour la parcelle:', plotId);

      const recommendations = await RecommendationsServiceInstance.getLatestRecommendations(
        plotId,
        serviceOptions
      );

      setData(recommendations);
      onSuccess?.(recommendations);

      console.log('✅ [useLatestRecommendations] Dernières recommandations récupérées:', recommendations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useLatestRecommendations] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, JSON.stringify(serviceOptions), onError, onSuccess, enabled]);

  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchLatestRecommendations();
    }
  }, [fetchLatestRecommendations, refetchOnMount, plotId, enabled]);

  const refetch = useCallback(async () => {
    await fetchLatestRecommendations();
  }, [fetchLatestRecommendations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}