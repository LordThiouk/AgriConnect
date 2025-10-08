import { useCache } from './useCache';
import { ProducersServiceInstance as ProducersService } from '../services/domain/producers';
import { Producer, ProducerFilters, ProducerStats } from '../services/domain/producers/producers.types';

/**
 * Hook pour récupérer les producteurs assignés à un agent.
 * @param agentId - L'ID de l'agent.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useAgentProducers(
  agentId: string,
  filters?: ProducerFilters,
  options = {}
) {
  const key = `producers:agent:${agentId}:${JSON.stringify(filters || {})}`;
  
  const fetcher = async () => {
    console.log(`🚀 [useAgentProducers] Fetching producers for agent: ${agentId}`);
    return ProducersService.getProducersByAgentId(agentId, filters);
  };

  return useCache<Producer[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer un producteur par son ID.
 * @param producerId - L'ID du producteur.
 * @param options - Options de cache.
 */
export function useProducerById(producerId: string | null, options = {}) {
  const key = producerId ? `producers:${producerId}` : null;
  
  const fetcher = async () => {
    if (!producerId) return null;
    console.log(`🚀 [useProducerById] Fetching producer: ${producerId}`);
    return ProducersService.getProducerById(producerId);
  };

  return useCache<Producer | null>(key, fetcher, options);
}

/**
 * Hook pour récupérer les statistiques des producteurs pour un agent.
 * @param agentId - L'ID de l'agent.
 * @param options - Options de cache.
 */
export function useProducerStats(agentId: string, options = {}) {
  const key = `producers:stats:${agentId}`;
  
  const fetcher = async () => {
    console.log(`🚀 [useProducerStats] Fetching stats for agent: ${agentId}`);
    return ProducersService.getProducerStats(agentId);
  };

  return useCache<ProducerStats>(key, fetcher, options);
}
