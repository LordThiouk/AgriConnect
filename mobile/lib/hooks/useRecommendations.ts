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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchRecommendations = useCallback(async () => {
    if (!plotId) return;

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
  }, [plotId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchRecommendations();
    }
  }, [fetchRecommendations, refetchOnMount, plotId]);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchLatestRecommendations = useCallback(async () => {
    if (!plotId) return;

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
  }, [plotId, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchLatestRecommendations();
    }
  }, [fetchLatestRecommendations, refetchOnMount, plotId]);

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