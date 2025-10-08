/**
 * Hook pour la gestion des fiches d'exploitation - AgriConnect
 * Utilise FarmFilesService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { FarmFilesServiceInstance } from '../services/domain/farmfiles';
import { 
  FarmFileDisplay, 
  FarmFileFilters, 
  FarmFileSort, 
  FarmFileServiceOptions,
  FarmFileStats
} from '../services/domain/farmfiles/farmfiles.types';

export interface UseFarmFilesOptions extends FarmFileServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: FarmFileDisplay[]) => void;
}

export interface UseFarmFilesResult {
  data: FarmFileDisplay[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  stats: FarmFileStats | null;
  loadingStats: boolean;
}

/**
 * Hook pour récupérer les fiches d'exploitation d'un agent
 */
export function useFarmFiles(
  agentId: string,
  filters?: FarmFileFilters,
  sort?: FarmFileSort,
  options: UseFarmFilesOptions = {}
): UseFarmFilesResult {
  const [data, setData] = useState<FarmFileDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<FarmFileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchFarmFiles = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useFarmFiles] Récupération des fiches pour l\'agent:', agentId);

      const farmFiles = await FarmFilesServiceInstance.getFarmFiles(
        agentId,
        filters,
        sort,
        serviceOptions
      );

      setData(farmFiles);
      onSuccess?.(farmFiles);

      console.log('✅ [useFarmFiles] Fiches récupérées:', farmFiles.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useFarmFiles] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId, filters, sort]);

  const fetchStats = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoadingStats(true);
      const farmFileStats = await FarmFilesServiceInstance.getAgentFarmFileStats(
        agentId,
        serviceOptions
      );
      setStats(farmFileStats);
    } catch (err) {
      console.error('❌ [useFarmFiles] Erreur stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (refetchOnMount && agentId) {
      fetchFarmFiles();
      fetchStats();
    }
  }, [fetchFarmFiles, fetchStats, refetchOnMount, agentId]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchFarmFiles(), fetchStats()]);
  }, [fetchFarmFiles, fetchStats]);

  return {
    data,
    loading,
    error,
    refetch,
    stats,
    loadingStats
  };
}

/**
 * Hook pour récupérer une fiche d'exploitation par ID
 */
export function useFarmFile(
  farmFileId: string,
  options: UseFarmFilesOptions = {}
) {
  const [data, setData] = useState<FarmFileDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchFarmFile = useCallback(async () => {
    if (!farmFileId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useFarmFile] Récupération de la fiche:', farmFileId);

      const farmFile = await FarmFilesServiceInstance.getFarmFileById(
        farmFileId,
        serviceOptions
      );

      setData(farmFile);
      onSuccess?.(farmFile ? [farmFile] : []);

      console.log('✅ [useFarmFile] Fiche récupérée:', farmFile?.name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useFarmFile] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [farmFileId]);

  useEffect(() => {
    if (refetchOnMount && farmFileId) {
      fetchFarmFile();
    }
  }, [fetchFarmFile, refetchOnMount, farmFileId]);

  const refetch = useCallback(async () => {
    await fetchFarmFile();
  }, [fetchFarmFile]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour les statistiques des fiches d'un agent
 */
export function useFarmFileStats(
  agentId: string,
  options: UseFarmFilesOptions = {}
) {
  const [data, setData] = useState<FarmFileStats | null>(null);
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

      console.log('🔄 [useFarmFileStats] Récupération des stats pour l\'agent:', agentId);

      const stats = await FarmFilesServiceInstance.getAgentFarmFileStats(
        agentId,
        serviceOptions
      );

      setData(stats);
      onSuccess?.([]); // Pas de données à passer pour les stats

      console.log('✅ [useFarmFileStats] Stats récupérées:', stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useFarmFileStats] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (refetchOnMount && agentId) {
      fetchStats();
    }
  }, [fetchStats, refetchOnMount, agentId]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch
  };
}