/**
 * Cache pour le service Observations - AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { ObservationDisplay, GlobalObservationDisplay, ObservationStats } from './observations.types';

export class ObservationsCache {
  private readonly PREFIX = 'observations';
  private readonly TTL = 2 * 60 * 1000; // 2 minutes (données plus dynamiques)

  /**
   * Récupère les observations d'une parcelle depuis le cache
   */
  async getPlotObservations(plotId: string): Promise<ObservationDisplay[] | null> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les observations d'une parcelle
   */
  async setPlotObservations(plotId: string, observations: ObservationDisplay[], ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    await agriConnectCache.set(key, observations, ttl || this.TTL);
  }

  /**
   * Récupère les dernières observations d'une parcelle depuis le cache
   */
  async getLatestPlotObservations(plotId: string): Promise<ObservationDisplay[] | null> {
    const key = `${this.PREFIX}:latest:plot:${plotId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les dernières observations d'une parcelle
   */
  async setLatestPlotObservations(plotId: string, observations: ObservationDisplay[], ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:latest:plot:${plotId}`;
    await agriConnectCache.set(key, observations, ttl || this.TTL);
  }

  /**
   * Récupère les observations d'un agent depuis le cache
   */
  async getAgentObservations(agentId: string): Promise<GlobalObservationDisplay[] | null> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les observations d'un agent
   */
  async setAgentObservations(agentId: string, observations: GlobalObservationDisplay[], ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    await agriConnectCache.set(key, observations, ttl || this.TTL);
  }

  /**
   * Récupère les statistiques des observations d'un agent depuis le cache
   */
  async getAgentObservationStats(agentId: string): Promise<ObservationStats | null> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les statistiques des observations d'un agent
   */
  async setAgentObservationStats(agentId: string, stats: ObservationStats, ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    await agriConnectCache.set(key, stats, ttl || this.TTL);
  }

  /**
   * Invalide le cache des observations d'une parcelle
   */
  async invalidatePlotObservations(plotId: string): Promise<void> {
    const patterns = [
      `${this.PREFIX}:plot:${plotId}`,
      `${this.PREFIX}:latest:plot:${plotId}`,
      `${this.PREFIX}:agent:*`,
      `${this.PREFIX}:stats:*`
    ];
    
    for (const pattern of patterns) {
      await agriConnectCache.invalidate({ pattern });
    }
  }

  /**
   * Invalide le cache des observations d'un agent
   */
  async invalidateAgentObservations(agentId: string): Promise<void> {
    const patterns = [
      `${this.PREFIX}:agent:${agentId}`,
      `${this.PREFIX}:stats:${agentId}`,
      `${this.PREFIX}:plot:*`,
      `${this.PREFIX}:latest:plot:*`
    ];
    
    for (const pattern of patterns) {
      await agriConnectCache.invalidate({ pattern });
    }
  }
}