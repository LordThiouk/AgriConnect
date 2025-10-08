/**
 * Cache pour le service Inputs
 */

import { agriConnectCache } from '../../core/cache';
import { Input, InputWithDetails, InputStats } from './inputs.types';

export class InputsCache {
  private cache: typeof agriConnectCache;

  constructor(cache: typeof agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `inputs:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getByTypeKey = (type: string, filters?: any) => 
    this.getKey(`type:${type}:${filters ? JSON.stringify(filters) : 'all'}`);
  private getByCategoryKey = (category: string, filters?: any) => 
    this.getKey(`category:${category}:${filters ? JSON.stringify(filters) : 'all'}`);

  // Gestion des listes
  async getList(filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getListKey(filters));
  }

  async setList(data: Input[], filters?: any, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Input | null> {
    return this.cache.get<Input>(this.getItemKey(id));
  }

  async setItem(id: string, data: Input, ttl: number = 15 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des intrants par type
  async getByType(type: string, filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getByTypeKey(type, filters));
  }

  async setByType(type: string, data: Input[], filters?: any, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getByTypeKey(type, filters), data, ttl);
  }

  // Gestion des intrants par catégorie
  async getByCategory(category: string, filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getByCategoryKey(category, filters));
  }

  async setByCategory(category: string, data: Input[], filters?: any, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getByCategoryKey(category, filters), data, ttl);
  }

  // Gestion des intrants avec détails
  async getItemWithDetails(id: string): Promise<InputWithDetails | null> {
    return this.cache.get<InputWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: InputWithDetails, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<InputStats | null> {
    return this.cache.get<InputStats>(this.getStatsKey());
  }

  async setStats(data: InputStats, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion des intrants disponibles
  async getAvailable(filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getKey(`available:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setAvailable(data: Input[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`available:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des intrants en rupture de stock
  async getOutOfStock(filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getKey(`out_of_stock:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setOutOfStock(data: Input[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`out_of_stock:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des intrants à stock faible
  async getLowStock(filters?: any): Promise<Input[] | null> {
    return this.cache.get<Input[]>(this.getKey(`low_stock:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setLowStock(data: Input[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`low_stock:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'inputs:list:*' });
  }

  async invalidateByType(type: string): Promise<void> {
    await this.cache.invalidate({ pattern: `inputs:type:${type}:*` });
  }

  async invalidateByCategory(category: string): Promise<void> {
    await this.cache.invalidate({ pattern: `inputs:category:${category}:*` });
  }

  async invalidateStock(): Promise<void> {
    await this.cache.invalidate({ pattern: 'inputs:available:*' });
    await this.cache.invalidate({ pattern: 'inputs:out_of_stock:*' });
    await this.cache.invalidate({ pattern: 'inputs:low_stock:*' });
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'inputs:*' });
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
