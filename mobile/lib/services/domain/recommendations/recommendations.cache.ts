/**
 * Cache pour le service Recommendations
 */

import { agriConnectCache } from '../../core/cache';
import { Recommendation, RecommendationWithDetails, RecommendationStats } from './recommendations.types';

export class RecommendationsCache {
  private cache: agriConnectCache;

  constructor(cache: agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `recommendations:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getUserRecommendationsKey = (userId: string, filters?: any) => 
    this.getKey(`user:${userId}:${filters ? JSON.stringify(filters) : 'all'}`);

  // Gestion des listes
  async getList(filters?: any): Promise<Recommendation[] | null> {
    return this.cache.get<Recommendation[]>(this.getListKey(filters));
  }

  async setList(data: Recommendation[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Recommendation | null> {
    return this.cache.get<Recommendation>(this.getItemKey(id));
  }

  async setItem(id: string, data: Recommendation, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des recommandations utilisateur
  async getUserRecommendations(userId: string, filters?: any): Promise<Recommendation[] | null> {
    return this.cache.get<Recommendation[]>(this.getUserRecommendationsKey(userId, filters));
  }

  async setUserRecommendations(userId: string, data: Recommendation[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getUserRecommendationsKey(userId, filters), data, ttl);
  }

  // Gestion des recommandations avec détails
  async getItemWithDetails(id: string): Promise<RecommendationWithDetails | null> {
    return this.cache.get<RecommendationWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: RecommendationWithDetails, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<RecommendationStats | null> {
    return this.cache.get<RecommendationStats>(this.getStatsKey());
  }

  async setStats(data: RecommendationStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion des recommandations par type
  async getByType(type: string, filters?: any): Promise<Recommendation[] | null> {
    return this.cache.get<Recommendation[]>(this.getKey(`type:${type}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByType(type: string, data: Recommendation[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`type:${type}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des recommandations par région
  async getByRegion(region: string, filters?: any): Promise<Recommendation[] | null> {
    return this.cache.get<Recommendation[]>(this.getKey(`region:${region}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByRegion(region: string, data: Recommendation[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`region:${region}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des recommandations par culture
  async getByCrop(crop: string, filters?: any): Promise<Recommendation[] | null> {
    return this.cache.get<Recommendation[]>(this.getKey(`crop:${crop}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByCrop(crop: string, data: Recommendation[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`crop:${crop}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'recommendations:list:*' });
  }

  async invalidateUserRecommendations(userId: string): Promise<void> {
    await this.cache.invalidate({ pattern: `recommendations:user:${userId}:*` });
  }

  async invalidateByType(type: string): Promise<void> {
    await this.cache.invalidate({ pattern: `recommendations:type:${type}:*` });
  }

  async invalidateByRegion(region: string): Promise<void> {
    await this.cache.invalidate({ pattern: `recommendations:region:${region}:*` });
  }

  async invalidateByCrop(crop: string): Promise<void> {
    await this.cache.invalidate({ pattern: `recommendations:crop:${crop}:*` });
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'recommendations:*' });
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
