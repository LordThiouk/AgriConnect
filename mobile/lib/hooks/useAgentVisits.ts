/**
 * Hook pour la gestion des visites d'agent - AgriConnect
 * Utilise VisitsService avec cache intelligent
 */

import { useCache } from './useCache';
import { VisitsServiceInstance as VisitsService } from '../services/domain/visits';
import { Visit, VisitFilters, VisitStats } from '../services/domain/visits/visits.types';

/**
 * Hook pour récupérer les visites d'un agent.
 * @param agentId - L'ID de l'agent.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useAgentVisits(
  agentId: string | null,
  filters?: VisitFilters,
  options = {}
) {
  const key = agentId ? `visits:agent:${agentId}:${JSON.stringify(filters || {})}` : null;

  const fetcher = async () => {
    if (!agentId) return [];
    console.log(`🚀 [useAgentVisits] Fetching visits for agent: ${agentId}`);
    console.log(`🔍 [useAgentVisits] Filters applied:`, filters);
    const result = await VisitsService.getAgentVisits(agentId, filters);
    console.log(`✅ [useAgentVisits] Result:`, {
      count: result.length,
      visits: result.map(v => ({
        id: v.id,
        type: v.visit_type,
        status: v.status,
        date: v.visit_date,
        producer: v.producer_name,
        plot: v.plot_name
      }))
    });
    return result;
  };

  return useCache<Visit[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer les statistiques des visites pour un agent.
 * @param agentId - L'ID de l'agent.
 * @param options - Options de cache.
 */
export function useVisitStats(
  agentId: string | null,
  options = {}
) {
  const key = agentId ? `visits:stats:${agentId}` : null;

  const fetcher = async () => {
    if (!agentId) return null;
    console.log(`🚀 [useVisitStats] Fetching visit stats for agent: ${agentId}`);
    return VisitsService.getVisitStats(agentId);
  };

  return useCache<VisitStats | null>(key, fetcher, options);
}
