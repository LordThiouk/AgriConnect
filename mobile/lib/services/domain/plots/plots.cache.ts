/**
 * Cache spécifique pour les parcelles
 * Utilise le système de cache centralisé AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { PlotDisplay } from './plots.types';

export class PlotsCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Récupère les parcelles d'un agent depuis le cache
   */
  async getAgentPlots(agentId: string): Promise<PlotDisplay[] | null> {
    const key = `plots:agent:${agentId}`;
    return await agriConnectCache.get<PlotDisplay[]>(key);
  }

  /**
   * Met en cache les parcelles d'un agent
   */
  async setAgentPlots(agentId: string, plots: PlotDisplay[], ttl?: number): Promise<void> {
    const key = `plots:agent:${agentId}`;
    await agriConnectCache.set(key, plots, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère une parcelle spécifique depuis le cache
   */
  async getPlot(plotId: string): Promise<PlotDisplay | null> {
    const key = `plot:${plotId}`;
    return await agriConnectCache.get<PlotDisplay>(key);
  }

  /**
   * Met en cache une parcelle spécifique
   */
  async setPlot(plotId: string, plot: PlotDisplay, ttl?: number): Promise<void> {
    const key = `plot:${plotId}`;
    await agriConnectCache.set(key, plot, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère les parcelles d'une fiche d'exploitation depuis le cache
   */
  async getFarmFilePlots(farmFileId: string): Promise<PlotDisplay[] | null> {
    const key = `plots:farmfile:${farmFileId}`;
    return await agriConnectCache.get<PlotDisplay[]>(key);
  }

  /**
   * Met en cache les parcelles d'une fiche d'exploitation
   */
  async setFarmFilePlots(farmFileId: string, plots: PlotDisplay[], ttl?: number): Promise<void> {
    const key = `plots:farmfile:${farmFileId}`;
    await agriConnectCache.set(key, plots, ttl || this.DEFAULT_TTL);
  }

  /**
   * Invalide le cache des parcelles d'un agent
   */
  async invalidateAgentPlots(agentId: string): Promise<void> {
    const key = `plots:agent:${agentId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide le cache d'une parcelle spécifique
   */
  async invalidatePlot(plotId: string): Promise<void> {
    const keys = [
      `plot:${plotId}`,
      `recommendations:plot:${plotId}`,
      `operations:plot:${plotId}`,
      `observations:plot:${plotId}`,
      `inputs:plot:${plotId}`,
      `participants:plot:${plotId}`,
      `crops:plot:${plotId}`,
      `activecrop:plot:${plotId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache des parcelles d'une fiche d'exploitation
   */
  async invalidateFarmFilePlots(farmFileId: string): Promise<void> {
    const key = `plots:farmfile:${farmFileId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide tout le cache des parcelles
   */
  async invalidateAll(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'plots:*' });
    await agriConnectCache.invalidate({ pattern: 'plot:*' });
    await agriConnectCache.invalidate({ pattern: 'recommendations:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'operations:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'observations:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'inputs:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'participants:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'crops:plot:*' });
    await agriConnectCache.invalidate({ pattern: 'activecrop:plot:*' });
  }

  /**
   * Invalide le cache des parcelles d'un producteur
   */
  async invalidateProducerPlots(producerId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `plots:*:producer:${producerId}` });
  }
}
