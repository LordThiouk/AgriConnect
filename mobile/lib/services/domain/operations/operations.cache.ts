/**
 * Cache spécifique pour les opérations
 * Utilise le système de cache centralisé AgriConnect
 */

import { agriConnectCache } from '../../core/cache';
import { Operation } from './operations.types';

export class OperationsCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Récupère les opérations d'une parcelle depuis le cache
   */
  async getPlotOperations(plotId: string): Promise<Operation[] | null> {
    const key = `operations:plot:${plotId}`;
    return await agriConnectCache.get<Operation[]>(key);
  }

  /**
   * Met en cache les opérations d'une parcelle
   */
  async setPlotOperations(plotId: string, operations: Operation[], ttl?: number): Promise<void> {
    const key = `operations:plot:${plotId}`;
    await agriConnectCache.set(key, operations, ttl || this.DEFAULT_TTL );
  }

  /**
   * Récupère les opérations d'une culture depuis le cache
   */
  async getCropOperations(cropId: string): Promise<Operation[] | null> {
    const key = `operations:crop:${cropId}`;
    return await agriConnectCache.get<Operation[]>(key);
  }

  /**
   * Met en cache les opérations d'une culture
   */
  async setCropOperations(cropId: string, operations: Operation[], ttl?: number): Promise<void> {
    const key = `operations:crop:${cropId}`;
    await agriConnectCache.set(key, operations, ttl || this.DEFAULT_TTL );
  }

  /**
   * Récupère les dernières opérations d'une parcelle depuis le cache
   */
  async getLatestOperations(plotId: string): Promise<Operation[] | null> {
    const key = `latestoperations:plot:${plotId}`;
    return await agriConnectCache.get<Operation[]>(key);
  }

  /**
   * Met en cache les dernières opérations d'une parcelle
   */
  async setLatestOperations(plotId: string, operations: Operation[], ttl?: number): Promise<void> {
    const key = `latestoperations:plot:${plotId}`;
    await agriConnectCache.set(key, operations, ttl || this.DEFAULT_TTL );
  }

  /**
   * Récupère une opération spécifique depuis le cache
   */
  async getOperation(operationId: string): Promise<Operation | null> {
    const key = `operation:${operationId}`;
    return await agriConnectCache.get<Operation>(key);
  }

  /**
   * Met en cache une opération spécifique
   */
  async setOperation(operationId: string, operation: Operation, ttl?: number): Promise<void> {
    const key = `operation:${operationId}`;
    await agriConnectCache.set(key, operation, ttl || this.DEFAULT_TTL );
  }

  /**
   * Invalide le cache des opérations d'une parcelle
   */
  async invalidatePlotOperations(plotId: string): Promise<void> {
    const keys = [
      `operations:plot:${plotId}`,
      `latestoperations:plot:${plotId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache des opérations d'une culture
   */
  async invalidateCropOperations(cropId: string): Promise<void> {
    const key = `operations:crop:${cropId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide le cache d'une opération spécifique
   */
  async invalidateOperation(operationId: string): Promise<void> {
    const key = `operation:${operationId}`;
    await agriConnectCache.invalidate({ pattern: key });
  }

  /**
   * Invalide tout le cache des opérations
   */
  async invalidateAll(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'operations:*' });
    await agriConnectCache.invalidate({ pattern: 'latestoperations:*' });
    await agriConnectCache.invalidate({ pattern: 'operation:*' });
  }
}
