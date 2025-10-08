import { useCache } from './useCache';
import { PlotsServiceInstance as PlotsService } from '../services/domain/plots'; // Importe l'instance
import { PlotDisplay, PlotFilters, PlotSort, PlotStats } from '../services/domain/plots/plots.types';

/**
 * Hook pour récupérer les statistiques des parcelles pour un agent.
 * @param agentId - L'ID de l'agent.
 * @param options - Options de cache.
 */
export function usePlotStats(agentId: string | null, options = {}) {
  const key = agentId ? `plots:stats:${agentId}` : null;

  const fetcher = async () => {
    if (!agentId) return null;
    console.log(`🚀 [usePlotStats] Fetching plot stats for agent: ${agentId}`);
    return PlotsService.getPlotStats(agentId);
  };

  return useCache<PlotStats | null>(key, fetcher, options);
}

/**
 * Hook pour récupérer les parcelles d'un agent.
 * @param agentId - L'ID de l'agent.
 * @param filters - Filtres optionnels.
 * @param sort - Options de tri.
 * @param options - Options de cache.
 */
export function useAgentPlots(
  agentId: string | null,
  filters?: PlotFilters,
  sort?: PlotSort,
  options = {}
) {
  const key = agentId
    ? `plots:agent:${agentId}:${JSON.stringify(filters || {})}:${JSON.stringify(
        sort || {}
      )}`
    : null;

  const fetcher = async () => {
    if (!agentId) return [];
    console.log(`🚀 [useAgentPlots] Fetching plots for agent: ${agentId}`);
    return PlotsService.getAgentPlots(agentId, filters, sort);
  };

  return useCache<PlotDisplay[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer une parcelle par son ID.
 * @param plotId - L'ID de la parcelle.
 * @param options - Options de cache.
 */
export function usePlotById(plotId: string | null, options = {}) {
  const key = plotId ? `plots:${plotId}` : null;

  const fetcher = async () => {
    if (!plotId) return null;
    console.log(`🚀 [usePlotById] Fetching plot: ${plotId}`);
    return PlotsService.getPlotById(plotId);
  };

  return useCache<PlotDisplay | null>(key, fetcher, options);
}
