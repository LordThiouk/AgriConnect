/**
 * Cache pour le service Notifications
 */

import { agriConnectCache } from '../../core/cache';
import { Notification, NotificationWithDetails, NotificationStats } from './notifications.types';

export class NotificationsCache {
  private cache: typeof agriConnectCache;

  constructor(cache: typeof agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `notifications:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getUserNotificationsKey = (userId: string, filters?: any) => 
    this.getKey(`user:${userId}:${filters ? JSON.stringify(filters) : 'all'}`);

  // Gestion des listes
  async getList(filters?: any): Promise<Notification[] | null> {
    return this.cache.get<Notification[]>(this.getListKey(filters));
  }

  async setList(data: Notification[], filters?: any, ttl: number = 2 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Notification | null> {
    return this.cache.get<Notification>(this.getItemKey(id));
  }

  async setItem(id: string, data: Notification, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des notifications utilisateur
  async getUserNotifications(userId: string, filters?: any): Promise<Notification[] | null> {
    return this.cache.get<Notification[]>(this.getUserNotificationsKey(userId, filters));
  }

  async setUserNotifications(userId: string, data: Notification[], filters?: any, ttl: number = 2 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getUserNotificationsKey(userId, filters), data, ttl);
  }

  // Gestion des notifications avec détails
  async getItemWithDetails(id: string): Promise<NotificationWithDetails | null> {
    return this.cache.get<NotificationWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: NotificationWithDetails, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<NotificationStats | null> {
    return this.cache.get<NotificationStats>(this.getStatsKey());
  }

  async setStats(data: NotificationStats, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion des notifications non lues
  async getUnreadCount(userId: string): Promise<number | null> {
    return this.cache.get<number>(this.getKey(`unread_count:${userId}`));
  }

  async setUnreadCount(userId: string, count: number, ttl: number = 1 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`unread_count:${userId}`), count, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'notifications:list:*' });
  }

  async invalidateUserNotifications(userId: string): Promise<void> {
    await this.cache.invalidate({ pattern: `notifications:user:${userId}:*` });
    await this.cache.delete(this.getKey(`unread_count:${userId}`));
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'notifications:*' });
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
