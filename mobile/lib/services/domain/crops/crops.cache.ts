/**
 * Cache spécifique pour les cultures
 * Utilise le système de cache centralisé AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { Crop } from './crops.types';

export class CropsCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Récupère les cultures d'une parcelle depuis le cache
   */
  async getPlotCrops(plotId: string): Promise<Crop[] | null> {
    const key = `crops:plot:${plotId}`;
    return await agriConnectCache.get<Crop[]>(key);
  }

  /**
   * Met en cache les cultures d'une parcelle
   */
  async setPlotCrops(plotId: string, crops: Crop[], ttl?: number): Promise<void> {
    const key = `crops:plot:${plotId}`;
    await agriConnectCache.set(key, crops, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère la culture active d'une parcelle depuis le cache
   */
  async getActiveCrop(plotId: string): Promise<Crop | null> {
    const key = `activecrop:plot:${plotId}`;
    return await agriConnectCache.get<Crop>(key);
  }

  /**
   * Met en cache la culture active d'une parcelle
   */
  async setActiveCrop(plotId: string, crop: Crop, ttl?: number): Promise<void> {
    const key = `activecrop:plot:${plotId}`;
    await agriConnectCache.set(key, crop, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère les cultures d'une saison depuis le cache
   */
  async getSeasonCrops(seasonId: string): Promise<Crop[] | null> {
    const key = `crops:season:${seasonId}`;
    return await agriConnectCache.get<Crop[]>(key);
  }

  /**
   * Met en cache les cultures d'une saison
   */
  async setSeasonCrops(seasonId: string, crops: Crop[], ttl?: number): Promise<void> {
    const key = `crops:season:${seasonId}`;
    await agriConnectCache.set(key, crops, ttl || this.DEFAULT_TTL);
  }

  /**
   * Récupère une culture spécifique depuis le cache
   */
  async getCrop(cropId: string): Promise<Crop | null> {
    const key = `crop:${cropId}`;
    return await agriConnectCache.get<Crop>(key);
  }

  /**
   * Met en cache une culture spécifique
   */
  async setCrop(cropId: string, crop: Crop, ttl?: number): Promise<void> {
    const key = `crop:${cropId}`;
    await agriConnectCache.set(key, crop, ttl || this.DEFAULT_TTL);
  }

  /**
   * Invalide le cache des cultures d'une parcelle
   */
  async invalidatePlotCrops(plotId: string): Promise<void> {
    const keys = [
      `crops:plot:${plotId}`,
      `activecrop:plot:${plotId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache d'une culture spécifique
   */
  async invalidateCrop(cropId: string): Promise<void> {
    const key = `crop:${cropId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide le cache des cultures d'une saison
   */
  async invalidateSeasonCrops(seasonId: string): Promise<void> {
    const key = `crops:season:${seasonId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide tout le cache des cultures
   */
  async invalidateAll(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'crops:*' });
    await agriConnectCache.invalidate({ pattern: 'activecrop:*' });
    await agriConnectCache.invalidate({ pattern: 'crop:*' });
  }
}
