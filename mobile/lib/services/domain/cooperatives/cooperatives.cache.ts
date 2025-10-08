/**
 * Cache pour le service Cooperatives
 */

import { agriConnectCache } from '../../core/cache';
import { Cooperative, CooperativeWithStats, CooperativeStats } from './cooperatives.types';

export class CooperativesCache {
  private cache: typeof agriConnectCache;

  constructor(cache: typeof agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `cooperatives:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');

  // Gestion des listes
  async getList(filters?: any): Promise<Cooperative[] | null> {
    return this.cache.get<Cooperative[]>(this.getListKey(filters));
  }

  async setList(data: Cooperative[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Cooperative | null> {
    return this.cache.get<Cooperative>(this.getItemKey(id));
  }

  async setItem(id: string, data: Cooperative, ttl: number = 15 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<CooperativeStats | null> {
    return this.cache.get<CooperativeStats>(this.getStatsKey());
  }

  async setStats(data: CooperativeStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion des coopératives avec stats
  async getItemWithStats(id: string): Promise<CooperativeWithStats | null> {
    return this.cache.get<CooperativeWithStats>(this.getKey(`item_with_stats:${id}`));
  }

  async setItemWithStats(id: string, data: CooperativeWithStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_stats:${id}`), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_stats:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'cooperatives:list:*' });
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'cooperatives:*' });
  }

  // Méthodes utilitaires
  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    await this.cache.set(key, data, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}
