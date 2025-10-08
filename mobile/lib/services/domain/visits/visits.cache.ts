/**
 * Cache spécifique pour les visites
 */

import { agriConnectCache } from '../../core/cache';
import { Visit, VisitDisplay, VisitStats } from './visits.types';

export class VisitsCache {
  private PREFIX = 'visits';
  private TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les visites d'une parcelle depuis le cache
   */
  async getPlotVisits(plotId: string): Promise<Visit[] | null> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    return await agriConnectCache.get<Visit[]>(key);
  }

  /**
   * Met en cache les visites d'une parcelle
   */
  async setPlotVisits(
    plotId: string, 
    visits: Visit[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:plot:${plotId}`;
    await agriConnectCache.set(key, visits, ttl || this.TTL );
  }

  /**
   * Récupère les visites d'un agent depuis le cache
   */
  async getAgentVisits(agentId: string): Promise<Visit[] | null> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    return await agriConnectCache.get<Visit[]>(key);
  }

  /**
   * Met en cache les visites d'un agent
   */
  async setAgentVisits(
    agentId: string, 
    visits: Visit[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    await agriConnectCache.set(key, visits, ttl || this.TTL );
  }

  /**
   * Récupère les visites du jour d'un agent depuis le cache
   */
  async getTodayVisits(agentId: string): Promise<Visit[] | null> {
    const key = `${this.PREFIX}:today:${agentId}`;
    return await agriConnectCache.get<Visit[]>(key);
  }

  /**
   * Met en cache les visites du jour d'un agent
   */
  async setTodayVisits(
    agentId: string, 
    visits: Visit[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:today:${agentId}`;
    await agriConnectCache.set(key, visits, ttl || this.TTL );
  }

  /**
   * Récupère les visites à venir d'un agent depuis le cache
   */
  async getUpcomingVisits(agentId: string): Promise<Visit[] | null> {
    const key = `${this.PREFIX}:upcoming:${agentId}`;
    return await agriConnectCache.get<Visit[]>(key);
  }

  /**
   * Met en cache les visites à venir d'un agent
   */
  async setUpcomingVisits(
    agentId: string, 
    visits: Visit[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:upcoming:${agentId}`;
    await agriConnectCache.set(key, visits, ttl || this.TTL );
  }

  /**
   * Récupère les visites passées d'un agent depuis le cache
   */
  async getPastVisits(agentId: string): Promise<Visit[] | null> {
    const key = `${this.PREFIX}:past:${agentId}`;
    return await agriConnectCache.get<Visit[]>(key);
  }

  /**
   * Met en cache les visites passées d'un agent
   */
  async setPastVisits(
    agentId: string, 
    visits: Visit[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:past:${agentId}`;
    await agriConnectCache.set(key, visits, ttl || this.TTL );
  }

  /**
   * Récupère une visite spécifique depuis le cache
   */
  async getVisit(visitId: string): Promise<Visit | null> {
    const key = `visit:${visitId}`;
    return await agriConnectCache.get<Visit>(key);
  }

  /**
   * Met en cache une visite spécifique
   */
  async setVisit(
    visitId: string, 
    visit: Visit, 
    ttl?: number
  ): Promise<void> {
    const key = `visit:${visitId}`;
    await agriConnectCache.set(key, visit, ttl || this.TTL );
  }

  /**
   * Récupère les statistiques des visites d'un agent depuis le cache
   */
  async getVisitStats(agentId: string): Promise<VisitStats | null> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    return await agriConnectCache.get<VisitStats>(key);
  }

  /**
   * Met en cache les statistiques des visites d'un agent
   */
  async setVisitStats(
    agentId: string, 
    stats: VisitStats, 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    await agriConnectCache.set(key, stats, ttl || this.TTL );
  }

  /**
   * Invalide le cache des visites d'une parcelle
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
   * Invalide le cache des visites d'un agent
   */
  async invalidateAgentCache(agentId: string): Promise<void> {
    const keys = [
      `${this.PREFIX}:agent:${agentId}`,
      `${this.PREFIX}:today:${agentId}`,
      `${this.PREFIX}:upcoming:${agentId}`,
      `${this.PREFIX}:past:${agentId}`,
      `${this.PREFIX}:stats:${agentId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache d'une visite spécifique
   */
  async invalidateVisitCache(visitId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `visit:${visitId}` });
  }

  /**
   * Invalide tout le cache des visites
   */
  async invalidateAllCache(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:*` });
    await agriConnectCache.invalidate({ pattern: 'visit:*' });
  }
}
