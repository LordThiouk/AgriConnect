/**
 * Hook pour la gestion des intervenants avec cache
 */

import { useCallback, useEffect, useState } from 'react';
import { useCache } from './useCache';
import { IntervenantsService } from '../services/domain/intervenants';
import { IntervenantsCache } from '../services/domain/intervenants';
import {
  Intervenant,
  IntervenantDisplay,
  IntervenantCreateData,
  IntervenantUpdateData,
  IntervenantServiceOptions
} from '../services/domain/intervenants';

export interface UseIntervenantsOptions extends IntervenantServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: IntervenantDisplay[] | Intervenant) => void;
}

export interface UseIntervenantsReturn {
  data: IntervenantDisplay[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createIntervenant: (data: IntervenantCreateData) => Promise<Intervenant | null>;
  updateIntervenant: (id: string, data: IntervenantUpdateData) => Promise<Intervenant | null>;
  deleteIntervenant: (id: string) => Promise<void>;
}

/**
 * Hook pour récupérer les intervenants d'une parcelle
 */
export const useIntervenantsByPlotId = (
  plotId: string,
  options: UseIntervenantsOptions = {}
): UseIntervenantsReturn => {
  const [data, setData] = useState<IntervenantDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntervenants = useCallback(async () => {
    if (!plotId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const intervenants = await IntervenantsService.getIntervenantsByPlotId(plotId, options);
      setData(intervenants);
      options.onSuccess?.(intervenants);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la récupération des intervenants');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [plotId, options]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchIntervenants();
    }
  }, [fetchIntervenants, options.refetchOnMount]);

  const createIntervenant = useCallback(async (intervenantData: IntervenantCreateData): Promise<Intervenant | null> => {
    try {
      const newIntervenant = await IntervenantsService.createIntervenant(intervenantData, options);
      
      // Rafraîchir les données après création
      await fetchIntervenants();
      
      return newIntervenant;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la création de l\'intervenant');
      options.onError?.(error);
      return null;
    }
  }, [fetchIntervenants, options]);

  const updateIntervenant = useCallback(async (id: string, updateData: IntervenantUpdateData): Promise<Intervenant | null> => {
    try {
      const updatedIntervenant = await IntervenantsService.updateIntervenant(id, updateData, options);
      
      // Rafraîchir les données après mise à jour
      await fetchIntervenants();
      
      return updatedIntervenant;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour de l\'intervenant');
      options.onError?.(error);
      return null;
    }
  }, [fetchIntervenants, options]);

  const deleteIntervenant = useCallback(async (id: string): Promise<void> => {
    try {
      await IntervenantsService.deleteIntervenant(id, options);
      
      // Rafraîchir les données après suppression
      await fetchIntervenants();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la suppression de l\'intervenant');
      options.onError?.(error);
      throw error;
    }
  }, [fetchIntervenants, options]);

  return {
    data,
    loading,
    error,
    refetch: fetchIntervenants,
    createIntervenant,
    updateIntervenant,
    deleteIntervenant
  };
};

/**
 * Hook pour récupérer un intervenant par son ID
 */
export const useIntervenantById = (
  intervenantId: string,
  options: UseIntervenantsOptions = {}
): {
  data: Intervenant | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const [data, setData] = useState<Intervenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntervenant = useCallback(async () => {
    if (!intervenantId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const intervenant = await IntervenantsService.getIntervenantById(intervenantId, options);
      setData(intervenant);
      options.onSuccess?.(intervenant);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la récupération de l\'intervenant');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [intervenantId, options]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchIntervenant();
    }
  }, [fetchIntervenant, options.refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: fetchIntervenant
  };
};

/**
 * Hook pour invalider le cache des intervenants
 */
export const useInvalidateIntervenantsCache = () => {
  const invalidatePlotCache = useCallback(async (plotId: string) => {
    await IntervenantsCache.invalidatePlotCache(plotId);
  }, []);

  const invalidateAllCache = useCallback(async () => {
    await IntervenantsCache.invalidateAllCache();
  }, []);

  return {
    invalidatePlotCache,
    invalidateAllCache
  };
};
