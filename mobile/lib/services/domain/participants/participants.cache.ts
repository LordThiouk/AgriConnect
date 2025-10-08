/**
 * Cache pour le service Participants
 */

import { agriConnectCache } from '../../core/cache';
import { Participant, ParticipantWithDetails, ParticipantStats, ParticipantWorkload } from './participants.types';

export class ParticipantsCache {
  private cache: typeof agriConnectCache;

  constructor(cache: typeof agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `participants:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getPlotParticipantsKey = (plotId: string, filters?: any) => 
    this.getKey(`plot:${plotId}:${filters ? JSON.stringify(filters) : 'all'}`);
  private getFarmFileParticipantsKey = (farmFileId: string, filters?: any) => 
    this.getKey(`farm_file:${farmFileId}:${filters ? JSON.stringify(filters) : 'all'}`);

  // Gestion des listes
  async getList(filters?: any): Promise<Participant[] | null> {
    return this.cache.get<Participant[]>(this.getListKey(filters));
  }

  async setList(data: Participant[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<Participant | null> {
    return this.cache.get<Participant>(this.getItemKey(id));
  }

  async setItem(id: string, data: Participant, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des participants par parcelle
  async getPlotParticipants(plotId: string, filters?: any): Promise<Participant[] | null> {
    return this.cache.get<Participant[]>(this.getPlotParticipantsKey(plotId, filters));
  }

  async setPlotParticipants(plotId: string, data: Participant[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getPlotParticipantsKey(plotId, filters), data, ttl);
  }

  // Gestion des participants par fiche producteur
  async getFarmFileParticipants(farmFileId: string, filters?: any): Promise<Participant[] | null> {
    return this.cache.get<Participant[]>(this.getFarmFileParticipantsKey(farmFileId, filters));
  }

  async setFarmFileParticipants(farmFileId: string, data: Participant[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getFarmFileParticipantsKey(farmFileId, filters), data, ttl);
  }

  // Gestion des participants avec détails
  async getItemWithDetails(id: string): Promise<ParticipantWithDetails | null> {
    return this.cache.get<ParticipantWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: ParticipantWithDetails, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<ParticipantStats | null> {
    return this.cache.get<ParticipantStats>(this.getStatsKey());
  }

  async setStats(data: ParticipantStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion de la charge de travail
  async getWorkload(participantId: string): Promise<ParticipantWorkload | null> {
    return this.cache.get<ParticipantWorkload>(this.getKey(`workload:${participantId}`));
  }

  async setWorkload(participantId: string, data: ParticipantWorkload, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`workload:${participantId}`), data, ttl);
  }

  // Gestion des participants par rôle
  async getByRole(role: string, filters?: any): Promise<Participant[] | null> {
    return this.cache.get<Participant[]>(this.getKey(`role:${role}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByRole(role: string, data: Participant[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`role:${role}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des participants actifs
  async getActive(filters?: any): Promise<Participant[] | null> {
    return this.cache.get<Participant[]>(this.getKey(`active:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setActive(data: Participant[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`active:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
    await this.cache.delete(this.getKey(`workload:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'participants:list:*' });
  }

  async invalidatePlotParticipants(plotId: string): Promise<void> {
    await this.cache.invalidate({ pattern: `participants:plot:${plotId}:*` });
  }

  async invalidateFarmFileParticipants(farmFileId: string): Promise<void> {
    await this.cache.invalidate({ pattern: `participants:farm_file:${farmFileId}:*` });
  }

  async invalidateByRole(role: string): Promise<void> {
    await this.cache.invalidate({ pattern: `participants:role:${role}:*` });
  }

  async invalidateActive(): Promise<void> {
    await this.cache.invalidate({ pattern: 'participants:active:*' });
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'participants:*' });
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
