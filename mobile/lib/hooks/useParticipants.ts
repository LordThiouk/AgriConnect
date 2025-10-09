/**
 * Hook pour la gestion des participants - AgriConnect
 * Utilise ParticipantsService avec cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { ParticipantsServiceInstance } from '../services/domain/participants';
import { ParticipantServiceOptions } from '../services/domain/participants/participants.types';

export interface UseParticipantsOptions extends ParticipantServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any[]) => void;
  enabled?: boolean;
}

export interface UseParticipantsResult {
  data: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les participants d'une parcelle
 */
export function useParticipantsByPlot(
  plotId: string,
  options: UseParticipantsOptions = {}
): UseParticipantsResult {
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

  const fetchParticipants = useCallback(async () => {
    if (!plotId || !enabled) {
      if (loading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useParticipantsByPlot] Récupération des participants pour la parcelle:', plotId);

      const participants = await ParticipantsServiceInstance.getParticipantsByPlotId(
        plotId,
        serviceOptions
      );

      setData(participants);
      onSuccess?.(participants);

      console.log('✅ [useParticipantsByPlot] Participants récupérés:', participants.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      onError?.(error);
      console.error('❌ [useParticipantsByPlot] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [plotId, onError, onSuccess, enabled]);

  useEffect(() => {
    if (refetchOnMount && plotId && enabled) {
      fetchParticipants();
    }
  }, [fetchParticipants, refetchOnMount, plotId, enabled]);

  const refetch = useCallback(async () => {
    await fetchParticipants();
  }, [fetchParticipants]);

  return {
    data,
    loading,
    error,
    refetch
  };
}