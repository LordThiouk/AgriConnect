/**
 * Cache pour le service FarmFiles - AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { FarmFileDisplay, FarmFileStats } from './farmfiles.types';

export class FarmFilesCache {
  private readonly PREFIX = 'farmfiles';
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les fiches d'exploitation d'un agent depuis le cache
   */
  async getAgentFarmFiles(agentId: string): Promise<FarmFileDisplay[] | null> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les fiches d'exploitation d'un agent
   */
  async setAgentFarmFiles(agentId: string, farmFiles: FarmFileDisplay[], ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:agent:${agentId}`;
    await agriConnectCache.set(key, farmFiles, ttl || this.TTL);
  }

  /**
   * Récupère une fiche d'exploitation par ID depuis le cache
   */
  async getFarmFileById(farmFileId: string): Promise<FarmFileDisplay | null> {
    const key = `${this.PREFIX}:${farmFileId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache une fiche d'exploitation
   */
  async setFarmFileById(farmFileId: string, farmFile: FarmFileDisplay, ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:${farmFileId}`;
    await agriConnectCache.set(key, farmFile, ttl || this.TTL);
  }

  /**
   * Récupère les statistiques des fiches d'un agent depuis le cache
   */
  async getAgentFarmFileStats(agentId: string): Promise<FarmFileStats | null> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    return await agriConnectCache.get(key);
  }

  /**
   * Met en cache les statistiques des fiches d'un agent
   */
  async setAgentFarmFileStats(agentId: string, stats: FarmFileStats, ttl?: number): Promise<void> {
    const key = `${this.PREFIX}:stats:${agentId}`;
    await agriConnectCache.set(key, stats, ttl || this.TTL);
  }

  /**
   * Invalide le cache des fiches d'un agent
   */
  async invalidateAgentFarmFiles(agentId: string): Promise<void> {
    const patterns = [
      `${this.PREFIX}:agent:${agentId}`,
      `${this.PREFIX}:stats:${agentId}`,
      `${this.PREFIX}:*`
    ];
    
    for (const pattern of patterns) {
      await agriConnectCache.invalidate({ pattern });
    }
  }

  /**
   * Invalide le cache d'une fiche spécifique
   */
  async invalidateFarmFile(farmFileId: string): Promise<void> {
    const patterns = [
      `${this.PREFIX}:${farmFileId}`,
      `${this.PREFIX}:agent:*`,
      `${this.PREFIX}:stats:*`
    ];
    
    for (const pattern of patterns) {
      await agriConnectCache.invalidate({ pattern });
    }
  }
}