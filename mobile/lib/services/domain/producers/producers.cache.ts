/**
 * Cache spécifique pour les producteurs
 * Utilise le système de cache centralisé AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { Producer, ProducerStats } from './producers.types';

export class ProducersCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Récupère les producteurs d'un agent depuis le cache
   */
  async getAgentProducers(agentId: string, filters?: any): Promise<Producer[] | null> {
    const key = `producers:agent:${agentId}:${JSON.stringify(filters || {})}`;
    return await agriConnectCache.get<Producer[]>(key);
  }

  /**
   * Met en cache les producteurs d'un agent
   */
  async setAgentProducers(agentId: string, producers: Producer[], filters?: any, ttl?: number): Promise<void> {
    const key = `producers:agent:${agentId}:${JSON.stringify(filters || {})}`;
    await agriConnectCache.set(key, producers, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère un producteur spécifique depuis le cache
   */
  async getProducer(producerId: string): Promise<Producer | null> {
    const key = `producers:${producerId}`;
    return await agriConnectCache.get<Producer>(key);
  }

  /**
   * Met en cache un producteur spécifique
   */
  async setProducer(producerId: string, producer: Producer, ttl?: number): Promise<void> {
    const key = `producers:${producerId}`;
    await agriConnectCache.set(key, producer, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère les statistiques de producteurs d'un agent depuis le cache
   */
  async getAgentStats(agentId: string): Promise<ProducerStats | null> {
    const key = `producers:stats:${agentId}`;
    return await agriConnectCache.get<ProducerStats>(key);
  }

  /**
   * Met en cache les statistiques de producteurs d'un agent
   */
  async setAgentStats(agentId: string, stats: ProducerStats, ttl?: number): Promise<void> {
    const key = `producers:stats:${agentId}`;
    await agriConnectCache.set(key, stats, ttl || this.DEFAULT_TTL);
  }

  /**
   * Invalide le cache des producteurs d'un agent
   */
  async invalidateAgentProducers(agentId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `producers:agent:${agentId}*` });
  }

  /**
   * Invalide le cache d'un producteur spécifique
   */
  async invalidateProducer(producerId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `producers:${producerId}` });
  }

  /**
   * Invalide le cache des statistiques d'un agent
   */
  async invalidateAgentStats(agentId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `producers:stats:${agentId}` });
  }

  /**
   * Vide le cache des statistiques pour un agent
   */
  async clearAgentStats(agentId: string): Promise<void> {
    await agriConnectCache.delete(`producers:stats:${agentId}`);
  }

  /**
   * Invalide tout le cache des producteurs
   */
  async invalidateAll(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'producers:*' });
  }
}
