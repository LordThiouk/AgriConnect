/**
 * Hook pour la gestion des observations - AgriConnect
 * Utilise ObservationsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { ObservationsServiceInstance } from '../services/domain/observations';
import { 
  ObservationDisplay, 
  GlobalObservationDisplay,
  ObservationFilters, 
  ObservationSort, 
  ObservationServiceOptions,
  ObservationStats
} from '../services/domain/observations/observations.types';

export interface UseObservationsOptions extends ObservationServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: ObservationDisplay[] | GlobalObservationDisplay[]) => void;
}

export interface UseObservationsResult {
  data: ObservationDisplay[] | GlobalObservationDisplay[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les observations d'une parcelle
 */
export function useObservationsByPlot(
  plotId: string,
  options: UseObservationsOptions = {}
): UseObservationsResult {
  const [data, setData] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchObservations = useCallback(async () => {
    if (!plotId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useObservationsByPlot] Récupération des observations pour la parcelle:', plotId);

      const observations = await ObservationsServiceInstance.getObservationsByPlotId(
        plotId,
        serviceOptions
      );

      setData(observations);
      onSuccess?.(observations);

      console.log('✅ [useObservationsByPlot] Observations récupérées:', observations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useObservationsByPlot] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchObservations();
    }
  }, [fetchObservations, refetchOnMount, plotId]);

  const refetch = useCallback(async () => {
    await fetchObservations();
  }, [fetchObservations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer les dernières observations d'une parcelle
 */
export function useLatestObservations(
  plotId: string,
  options: UseObservationsOptions = {}
): UseObservationsResult {
  const [data, setData] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchLatestObservations = useCallback(async () => {
    if (!plotId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useLatestObservations] Récupération des dernières observations pour la parcelle:', plotId);

      const observations = await ObservationsServiceInstance.getLatestObservations(
        plotId,
        serviceOptions
      );

      setData(observations);
      onSuccess?.(observations);

      console.log('✅ [useLatestObservations] Dernières observations récupérées:', observations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useLatestObservations] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchLatestObservations();
    }
  }, [fetchLatestObservations, refetchOnMount, plotId]);

  const refetch = useCallback(async () => {
    await fetchLatestObservations();
  }, [fetchLatestObservations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer les observations d'un agent
 */
export function useObservationsForAgent(
  agentId: string,
  limit: number = 50,
  offset: number = 0,
  observationTypeFilter?: string,
  severityFilter?: number,
  options: UseObservationsOptions = {}
): UseObservationsResult {
  const [data, setData] = useState<GlobalObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchObservations = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useObservationsForAgent] Récupération des observations pour l\'agent:', agentId);

      const observations = await ObservationsServiceInstance.getObservationsForAgent(
        agentId,
        limit,
        offset,
        observationTypeFilter,
        severityFilter,
        serviceOptions
      );

      setData(observations);
      onSuccess?.(observations);

      console.log('✅ [useObservationsForAgent] Observations récupérées:', observations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useObservationsForAgent] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId, limit, offset, observationTypeFilter, severityFilter, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && agentId) {
      fetchObservations();
    }
  }, [fetchObservations, refetchOnMount, agentId]);

  const refetch = useCallback(async () => {
    await fetchObservations();
  }, [fetchObservations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour les statistiques des observations d'un agent
 */
export function useObservationStats(
  agentId: string,
  options: UseObservationsOptions = {}
) {
  const [data, setData] = useState<ObservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchStats = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useObservationStats] Récupération des stats pour l\'agent:', agentId);

      const stats = await ObservationsServiceInstance.getAgentObservationStats(
        agentId,
        serviceOptions
      );

      setData(stats);
      onSuccess?.([]); // Pas de données à passer pour les stats

      console.log('✅ [useObservationStats] Stats récupérées:', stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useObservationStats] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && agentId) {
      fetchStats();
    }
  }, [fetchStats, refetchOnMount, agentId]);

  const refetch = useCallback(async () => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour créer une nouvelle observation
 */
export function useCreateObservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createObservation = useCallback(async (observationData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useCreateObservation] Création d\'une nouvelle observation');

      const observation = await ObservationsServiceInstance.createObservation(observationData);

      if (!observation) {
        throw new Error('Impossible de créer l\'observation');
      }

      console.log('✅ [useCreateObservation] Observation créée:', observation);
      return observation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useCreateObservation] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createObservation,
    loading,
    error
  };
}