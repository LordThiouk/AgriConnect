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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    refetchOnMount = true,
    onError,
    onSuccess,
    ...serviceOptions
  } = options;

  const fetchParticipants = useCallback(async () => {
    if (!plotId) return;

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
  }, [plotId, onError, onSuccess]);

  useEffect(() => {
    if (refetchOnMount && plotId) {
      fetchParticipants();
    }
  }, [fetchParticipants, refetchOnMount, plotId]);

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