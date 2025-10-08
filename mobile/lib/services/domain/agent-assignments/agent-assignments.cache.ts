/**
 * Cache pour le service AgentAssignments
 */

import { agriConnectCache } from '../../core/cache';
import { AgentAssignment, AgentAssignmentWithDetails, AgentAssignmentStats, AgentWorkload } from './agent-assignments.types';

export class AgentAssignmentsCache {
  private cache: agriConnectCache;

  constructor(cache: agriConnectCache) {
    this.cache = cache;
  }

  // Clés de cache
  private getKey = (suffix: string) => `agent_assignments:${suffix}`;
  private getListKey = (filters?: any) => 
    this.getKey(`list:${filters ? JSON.stringify(filters) : 'all'}`);
  private getItemKey = (id: string) => this.getKey(`item:${id}`);
  private getStatsKey = () => this.getKey('stats');
  private getAgentAssignmentsKey = (agentId: string, filters?: any) => 
    this.getKey(`agent:${agentId}:${filters ? JSON.stringify(filters) : 'all'}`);
  private getWorkloadKey = (agentId: string) => this.getKey(`workload:${agentId}`);

  // Gestion des listes
  async getList(filters?: any): Promise<AgentAssignment[] | null> {
    return this.cache.get<AgentAssignment[]>(this.getListKey(filters));
  }

  async setList(data: AgentAssignment[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getListKey(filters), data, ttl);
  }

  // Gestion des éléments individuels
  async getItem(id: string): Promise<AgentAssignment | null> {
    return this.cache.get<AgentAssignment>(this.getItemKey(id));
  }

  async setItem(id: string, data: AgentAssignment, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getItemKey(id), data, ttl);
  }

  // Gestion des assignations par agent
  async getAgentAssignments(agentId: string, filters?: any): Promise<AgentAssignment[] | null> {
    return this.cache.get<AgentAssignment[]>(this.getAgentAssignmentsKey(agentId, filters));
  }

  async setAgentAssignments(agentId: string, data: AgentAssignment[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getAgentAssignmentsKey(agentId, filters), data, ttl);
  }

  // Gestion des assignations avec détails
  async getItemWithDetails(id: string): Promise<AgentAssignmentWithDetails | null> {
    return this.cache.get<AgentAssignmentWithDetails>(this.getKey(`item_with_details:${id}`));
  }

  async setItemWithDetails(id: string, data: AgentAssignmentWithDetails, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`item_with_details:${id}`), data, ttl);
  }

  // Gestion des statistiques
  async getStats(): Promise<AgentAssignmentStats | null> {
    return this.cache.get<AgentAssignmentStats>(this.getStatsKey());
  }

  async setStats(data: AgentAssignmentStats, ttl: number = 10 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getStatsKey(), data, ttl);
  }

  // Gestion de la charge de travail
  async getWorkload(agentId: string): Promise<AgentWorkload | null> {
    return this.cache.get<AgentWorkload>(this.getWorkloadKey(agentId));
  }

  async setWorkload(agentId: string, data: AgentWorkload, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getWorkloadKey(agentId), data, ttl);
  }

  // Gestion des assignations par type
  async getByType(type: string, filters?: any): Promise<AgentAssignment[] | null> {
    return this.cache.get<AgentAssignment[]>(this.getKey(`type:${type}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByType(type: string, data: AgentAssignment[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`type:${type}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Gestion des assignations par statut
  async getByStatus(status: string, filters?: any): Promise<AgentAssignment[] | null> {
    return this.cache.get<AgentAssignment[]>(this.getKey(`status:${status}:${filters ? JSON.stringify(filters) : 'all'}`));
  }

  async setByStatus(status: string, data: AgentAssignment[], filters?: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.cache.set(this.getKey(`status:${status}:${filters ? JSON.stringify(filters) : 'all'}`), data, ttl);
  }

  // Invalidation
  async invalidateItem(id: string): Promise<void> {
    await this.cache.delete(this.getItemKey(id));
    await this.cache.delete(this.getKey(`item_with_details:${id}`));
  }

  async invalidateList(): Promise<void> {
    await this.cache.invalidate({ pattern: 'agent_assignments:list:*' });
  }

  async invalidateAgentAssignments(agentId: string): Promise<void> {
    await this.cache.invalidate({ pattern: `agent_assignments:agent:${agentId}:*` });
    await this.cache.delete(this.getWorkloadKey(agentId));
  }

  async invalidateByType(type: string): Promise<void> {
    await this.cache.invalidate({ pattern: `agent_assignments:type:${type}:*` });
  }

  async invalidateByStatus(status: string): Promise<void> {
    await this.cache.invalidate({ pattern: `agent_assignments:status:${status}:*` });
  }

  async invalidateStats(): Promise<void> {
    await this.cache.delete(this.getStatsKey());
  }

  async invalidateAll(): Promise<void> {
    await this.cache.invalidate({ pattern: 'agent_assignments:*' });
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
