/**
 * Cache spécifique pour les alertes
 * Utilise le système de cache centralisé AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { Alert, AlertStats } from './alerts.types';

export class AlertsCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Récupère les alertes d'un agent depuis le cache
   */
  async getAgentAlerts(agentId: string, filters?: any): Promise<Alert[] | null> {
    const key = `alerts:agent:${agentId}:${JSON.stringify(filters || {})}`;
    return await agriConnectCache.get<Alert[]>(key);
  }

  /**
   * Met en cache les alertes d'un agent
   */
  async setAgentAlerts(agentId: string, alerts: Alert[], filters?: any, ttl?: number): Promise<void> {
    const key = `alerts:agent:${agentId}:${JSON.stringify(filters || {})}`;
    await agriConnectCache.set(key, alerts, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère les statistiques d'alertes d'un agent depuis le cache
   */
  async getAgentStats(agentId: string): Promise<AlertStats | null> {
    const key = `alerts:stats:${agentId}`;
    return await agriConnectCache.get<AlertStats>(key);
  }

  /**
   * Met en cache les statistiques d'alertes d'un agent
   */
  async setAgentStats(agentId: string, stats: AlertStats, ttl?: number): Promise<void> {
    const key = `alerts:stats:${agentId}`;
    await agriConnectCache.set(key, stats, ttl || this.DEFAULT_TTL);
  }

  /**
   * Invalide le cache des alertes d'un agent
   */
  async invalidateAgentAlerts(agentId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `alerts:agent:${agentId}*` });
  }

  /**
   * Invalide le cache des statistiques d'un agent
   */
  async invalidateAgentStats(agentId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `alerts:stats:${agentId}` });
  }

  /**
   * Invalide tout le cache des alertes
   */
  async invalidateAll(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'alerts:*' });
  }
}
