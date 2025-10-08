/**
 * Hook pour la gestion des opérations agricoles - AgriConnect
 * Utilise OperationsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { OperationsServiceInstance } from '../services/domain/operations';
import { OperationServiceOptions } from '../services/domain/operations/operations.types';

export interface UseOperationsOptions extends OperationServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any[]) => void;
}

export interface UseOperationsResult {
  data: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les dernières opérations d'une parcelle
 */
export function useLatestOperations(
  plotId: string,
  limit: number = 5,
  options: UseOperationsOptions = {}
): UseOperationsResult {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchLatestOperations = useCallback(async () => {
    if (!plotId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useLatestOperations] Récupération des dernières opérations pour la parcelle:', plotId);

      const operations = await OperationsServiceInstance.getLatestOperations(
        plotId,
        limit,
        serviceOptions
      );

      setData(operations);
      onSuccess?.(operations);

      console.log('✅ [useLatestOperations] Dernières opérations récupérées:', operations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useLatestOperations] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, limit, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchLatestOperations();
    }
  }, [fetchLatestOperations, refetchOnMount, plotId]);

  const refetch = useCallback(async () => {
    await fetchLatestOperations();
  }, [fetchLatestOperations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer toutes les opérations d'une parcelle
 */
export function useOperationsByPlot(
  plotId: string,
  options: UseOperationsOptions = {}
): UseOperationsResult {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchOperations = useCallback(async () => {
    if (!plotId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useOperationsByPlot] Récupération des opérations pour la parcelle:', plotId);

      const operations = await OperationsServiceInstance.getOperationsByPlotId(
        plotId,
        serviceOptions
      );

      setData(operations);
      onSuccess?.(operations);

      console.log('✅ [useOperationsByPlot] Opérations récupérées:', operations.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useOperationsByPlot] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchOperations();
    }
  }, [fetchOperations, refetchOnMount, plotId]);

  const refetch = useCallback(async () => {
    await fetchOperations();
  }, [fetchOperations]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour créer une nouvelle opération
 */
export function useCreateOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createOperation = useCallback(async (operationData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useCreateOperation] Création d\'une nouvelle opération');

      const operation = await OperationsServiceInstance.addOperation(operationData);

      console.log('✅ [useCreateOperation] Opération créée:', operation);
      return operation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useCreateOperation] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOperation,
    loading,
    error
  };
}

/**
 * Hook pour mettre à jour une opération
 */
export function useUpdateOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateOperation = useCallback(async (operationId: string, operationData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useUpdateOperation] Mise à jour de l\'opération:', operationId);

      const operation = await OperationsServiceInstance.updateOperation(operationId, operationData);

      console.log('✅ [useUpdateOperation] Opération mise à jour:', operation);
      return operation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useUpdateOperation] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateOperation,
    loading,
    error
  };
}

/**
 * Hook pour supprimer une opération
 */
export function useDeleteOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteOperation = useCallback(async (operationId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useDeleteOperation] Suppression de l\'opération:', operationId);

      await OperationsServiceInstance.deleteOperation(operationId);

      console.log('✅ [useDeleteOperation] Opération supprimée');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useDeleteOperation] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteOperation,
    loading,
    error
  };
}