/**
 * Cache pour le service Seasons
 */

import { agriConnectCache } from '../../core/cache';
import { Season, SeasonWithDetails, SeasonStats } from './seasons.types';

export class SeasonsCache {
  private cache: agriConnectCache;

  constructor(cache: agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `seasons:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getActiveSeasonKey = () => this.getKey('active');
  private getCurrentYearKey = (year: number) => this.getKey(`year:${year}`);

  // Gestion des listes
  async getList(filters?: any): Promise<Season[] | null> {
    return this.cache.get<Season[]>(this.getListKey(filters));
  }

  async setList(data: Season[], filters?: any, ttl: number = 15 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Season | null> {
    return this.cache.get<Season>(this.getItemKey(id));
  }

  async setItem(id: string, data: Season, ttl: number = 30 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion de la saison active
  async getActiveSeason(): Promise<Season | null> {
    return this.cache.get<Season>(this.getActiveSeasonKey());
  }

  async setActiveSeason(data: Season, ttl: number = 30 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getActiveSeasonKey(), data, ttl);
  }

  // Gestion des saisons par année
  async getByYear(year: number): Promise<Season[] | null> {
    return this.cache.get<Season[]>(this.getCurrentYearKey(year));
  }

  async setByYear(year: number, data: Season[], ttl: number = 15 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getCurrentYearKey(year), data, ttl);
  }

  // Gestion des saisons avec détails
  async getItemWithDetails(id: string): Promise<SeasonWithDetails | null> {
    return this.cache.get<SeasonWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: SeasonWithDetails, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<SeasonStats | null> {
    return this.cache.get<SeasonStats>(this.getStatsKey());
  }

  async setStats(data: SeasonStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'seasons:list:*' });
  }

  async invalidateActiveSeason(): Promise<void> {
    await this.cache.delete(this.getActiveSeasonKey());
  }

  async invalidateByYear(year: number): Promise<void> {
    await this.cache.delete(this.getCurrentYearKey(year));
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'seasons:*' });
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
