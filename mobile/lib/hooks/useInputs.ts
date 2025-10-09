/**
 * Hook pour la gestion des intrants agricoles - AgriConnect
 * Utilise InputsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { InputsServiceInstance } from '../services/domain/inputs';
import { InputServiceOptions } from '../services/domain/inputs/inputs.types';

export interface UseInputsOptions extends InputServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any[]) => void;
  enabled?: boolean;
}

export interface UseInputsResult {
  data: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les derniers intrants d'une parcelle
 */
export function useLatestInputs(
  plotId: string,
  options: UseInputsOptions = {}
): UseInputsResult {
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

  const fetchLatestInputs = useCallback(async () => {
    if (!plotId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useLatestInputs] Récupération des derniers intrants pour la parcelle:', plotId);

      const inputs = await InputsServiceInstance.getLatestInputs(
        plotId,
        serviceOptions
      );

      setData(inputs);
      onSuccess?.(inputs);

      console.log('✅ [useLatestInputs] Derniers intrants récupérés:', inputs.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useLatestInputs] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, JSON.stringify(serviceOptions), onError, onSuccess, enabled]);

  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchLatestInputs();
    }
  }, [fetchLatestInputs, refetchOnMount, plotId, enabled]);

  const refetch = useCallback(async () => {
    await fetchLatestInputs();
  }, [fetchLatestInputs]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer tous les intrants d'une parcelle
 */
export function useInputsByPlot(
  plotId: string,
  options: UseInputsOptions = {}
): UseInputsResult {
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

  const fetchInputs = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useInputsByPlot] Récupération des intrants pour la parcelle:', plotId);

      const inputs = await InputsServiceInstance.getInputsByPlotId(
        plotId,
        serviceOptions
      );

      setData(inputs);
      onSuccess?.(inputs);

      console.log('✅ [useInputsByPlot] Intrants récupérés:', inputs.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useInputsByPlot] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, JSON.stringify(serviceOptions), onError, onSuccess, enabled]);

  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchInputs();
    }
  }, [fetchInputs, refetchOnMount, plotId, enabled]);

  const refetch = useCallback(async () => {
    await fetchInputs();
  }, [fetchInputs]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour créer un nouvel intrant
 */
export function useCreateInput() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createInput = useCallback(async (inputData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useCreateInput] Création d\'un nouvel intrant');

      const input = await InputsServiceInstance.addInput(inputData);

      console.log('✅ [useCreateInput] Intrant créé:', input);
      return input;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useCreateInput] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createInput,
    loading,
    error
  };
}

/**
 * Hook pour mettre à jour un intrant
 */
export function useUpdateInput() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateInput = useCallback(async (inputId: string, inputData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useUpdateInput] Mise à jour de l\'intrant:', inputId);

      const input = await InputsServiceInstance.updateInput(inputId, inputData);

      console.log('✅ [useUpdateInput] Intrant mis à jour:', input);
      return input;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useUpdateInput] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateInput,
    loading,
    error
  };
}

/**
 * Hook pour supprimer un intrant
 */
export function useDeleteInput() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteInput = useCallback(async (inputId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useDeleteInput] Suppression de l\'intrant:', inputId);

      await InputsServiceInstance.deleteInput(inputId);

      console.log('✅ [useDeleteInput] Intrant supprimé');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useDeleteInput] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteInput,
    loading,
    error
  };
}