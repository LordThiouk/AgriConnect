/**
 * Hook pour la gestion des visites - AgriConnect
 * Utilise VisitsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { VisitsServiceInstance } from '../services/domain/visits';
import { VisitServiceOptions } from '../services/domain/visits/visits.types';

export interface UseVisitsOptions extends VisitServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export interface UseVisitsResult {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer une visite par ID
 */
export function useVisitById(
  visitId: string,
  options: UseVisitsOptions = {}
): UseVisitsResult {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchVisit = useCallback(async () => {
    if (!visitId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useVisitById] Récupération de la visite:', visitId);

      const visit = await VisitsServiceInstance.getVisitById(visitId);

      setData(visit);
      onSuccess?.(visit);

      console.log('✅ [useVisitById] Visite récupérée:', visit?.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useVisitById] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [visitId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && visitId) {
      fetchVisit();
    }
  }, [fetchVisit, refetchOnMount, visitId]);

  const refetch = useCallback(async () => {
    await fetchVisit();
  }, [fetchVisit]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour récupérer une visite pour modification
 */
export function useVisitForEdit(
  visitId: string,
  options: UseVisitsOptions = {}
): UseVisitsResult {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchVisitForEdit = useCallback(async () => {
    if (!visitId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useVisitForEdit] Récupération de la visite pour modification:', visitId);

      const visit = await VisitsServiceInstance.getVisitForEdit(visitId);

      setData(visit);
      onSuccess?.(visit);

      console.log('✅ [useVisitForEdit] Visite récupérée pour modification:', visit?.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useVisitForEdit] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [visitId, serviceOptions, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && visitId) {
      fetchVisitForEdit();
    }
  }, [fetchVisitForEdit, refetchOnMount, visitId]);

  const refetch = useCallback(async () => {
    await fetchVisitForEdit();
  }, [fetchVisitForEdit]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook pour créer une nouvelle visite
 */
export function useCreateVisit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createVisit = useCallback(async (agentId: string, visitData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useCreateVisit] Création d\'une nouvelle visite pour l\'agent:', agentId);

      const visit = await VisitsServiceInstance.createVisit(agentId, visitData);

      console.log('✅ [useCreateVisit] Visite créée:', visit);
      return visit;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useCreateVisit] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createVisit,
    loading,
    error
  };
}

/**
 * Hook pour mettre à jour une visite
 */
export function useUpdateVisit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateVisit = useCallback(async (visitId: string, visitData: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useUpdateVisit] Mise à jour de la visite:', visitId);

      const visit = await VisitsServiceInstance.updateVisit(visitId, visitData);

      console.log('✅ [useUpdateVisit] Visite mise à jour:', visit);
      return visit;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      console.error('❌ [useUpdateVisit] Erreur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateVisit,
    loading,
    error
  };
}