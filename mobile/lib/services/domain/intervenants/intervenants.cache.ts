/**
 * Cache spécifique pour les intervenants
 */

import { agriConnectCache } from '../../core/cache';
import { Intervenant } from './intervenants.types';

export class IntervenantsCache {
  private PREFIX = 'intervenants';
  private TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les intervenants d'une parcelle depuis le cache
   */
  async getPlotIntervenants(plotId: string): Promise<Intervenant[] | null> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    return await agriConnectCache.get<Intervenant[]>(key);
  }

  /**
   * Met en cache les intervenants d'une parcelle
   */
  async setPlotIntervenants(
    plotId: string, 
    intervenants: Intervenant[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    await agriConnectCache.set(key, intervenants, ttl || this.TTL);
  }

  /**
   * Récupère un intervenant spécifique depuis le cache
   */
  async getIntervenant(intervenantId: string): Promise<Intervenant | null> {
    const key = `intervenant:${intervenantId}`;
    return await agriConnectCache.get<Intervenant>(key);
  }

  /**
   * Met en cache un intervenant spécifique
   */
  async setIntervenant(
    intervenantId: string, 
    intervenant: Intervenant, 
    ttl?: number
  ): Promise<void> {
    const key = `intervenant:${intervenantId}`;
    await agriConnectCache.set(key, intervenant, ttl || this.TTL);
  }

  /**
   * Récupère les intervenants d'un agent depuis le cache
   */
  async getAgentIntervenants(agentId: string): Promise<Intervenant[] | null> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    return await agriConnectCache.get<Intervenant[]>(key);
  }

  /**
   * Met en cache les intervenants d'un agent
   */
  async setAgentIntervenants(
    agentId: string, 
    intervenants: Intervenant[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    await agriConnectCache.set(key, intervenants, ttl || this.TTL);
  }

  /**
   * Invalide le cache des intervenants d'une parcelle
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    const keys = [
      `${this.PREFIX}:plot:${plotId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache d'un intervenant spécifique
   */
  async invalidateIntervenantCache(intervenantId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `intervenant:${intervenantId}` });
  }

  /**
   * Invalide le cache des intervenants d'un agent
   */
  async invalidateAgentCache(agentId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:agent:${agentId}` });
  }

  /**
   * Invalide tout le cache des intervenants
   */
  async invalidateAllCache(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:*` });
    await agriConnectCache.invalidate({ pattern: 'intervenant:*' });
  }
}
