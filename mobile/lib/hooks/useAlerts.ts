import { useCache } from './useCache';
import { AlertsServiceInstance as AlertsService } from '../services/domain/alerts';
import { Alert, AlertFilters, AlertStats } from '../services/domain/alerts/alerts.types';

/**
 * Hook pour récupérer les alertes d'un agent.
 * @param agentId - L'ID de l'agent.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useAgentAlerts(
  agentId: string | null,
  filters?: AlertFilters,
  options = {}
) {
  const key = agentId ? `alerts:agent:${agentId}:${JSON.stringify(filters || {})}` : null;

  const fetcher = async () => {
    if (!agentId) return [];
    console.log(`🚀 [useAgentAlerts] Fetching alerts for agent: ${agentId}`);
    return AlertsService.getAlertsForAgent(agentId, filters);
  };

  return useCache<Alert[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer les statistiques des alertes pour un agent.
 * @param agentId - L'ID de l'agent.
 * @param options - Options de cache.
 */
export function useAlertStats(agentId: string | null, options = {}) {
  const key = agentId ? `alerts:stats:${agentId}` : null;

  const fetcher = async () => {
    if (!agentId) return null;
    console.log(`🚀 [useAlertStats] Fetching stats for agent: ${agentId}`);
    return AlertsService.getAlertStats(agentId);
  };

  return useCache<AlertStats | null>(key, fetcher, options);
}
