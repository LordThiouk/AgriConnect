/**
 * Cache spécifique pour les médias
 */

import { agriConnectCache } from '../../core/cache';
import { MediaFile, MediaDisplay } from './media.types';

export class MediaCache {
  private PREFIX = 'media';
  private TTL = 15 * 60 * 1000; // 15 minutes (médias plus long à charger)

  /**
   * Récupère les médias d'une entité depuis le cache
   */
  async getEntityMedia(entityType: string, entityId: string): Promise<MediaFile[] | null> {
    const key = `${this.PREFIX}:${entityType}:${entityId}`;
    return await agriConnectCache.get<MediaFile[]>(key);
  }

  /**
   * Met en cache les médias d'une entité
   */
  async setEntityMedia(
    entityType: string,
    entityId: string,
    media: MediaFile[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:${entityType}:${entityId}`;
    await agriConnectCache.set(key, media, ttl || this.TTL );
  }

  /**
   * Récupère un média spécifique depuis le cache
   */
  async getMedia(mediaId: string): Promise<MediaFile | null> {
    const key = `${this.PREFIX}:${mediaId}`;
    return await agriConnectCache.get<MediaFile>(key);
  }

  /**
   * Met en cache un média spécifique
   */
  async setMedia(
    mediaId: string, 
    media: MediaFile, 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:${mediaId}`;
    await agriConnectCache.set(key, media, ttl || this.TTL );
  }

  /**
   * Récupère les médias d'un propriétaire depuis le cache
   */
  async getOwnerMedia(ownerId: string): Promise<MediaFile[] | null> {
    const key = `${this.PREFIX}:owner:${ownerId}`;
    return await agriConnectCache.get<MediaFile[]>(key);
  }

  /**
   * Met en cache les médias d'un propriétaire
   */
  async setOwnerMedia(
    ownerId: string, 
    media: MediaFile[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:owner:${ownerId}`;
    await agriConnectCache.set(key, media, ttl || this.TTL );
  }

  /**
   * Invalide le cache des médias d'une entité
   */
  async invalidateEntityCache(entityType: string, entityId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:${entityType}:${entityId}` });
  }

  /**
   * Invalide le cache d'un média spécifique
   */
  async invalidateMediaCache(mediaId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:${mediaId}` });
  }

  /**
   * Invalide le cache des médias d'un propriétaire
   */
  async invalidateOwnerCache(ownerId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:owner:${ownerId}` });
  }

  /**
   * Invalide tout le cache des médias
   */
  async invalidateAllCache(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:*` });
  }
}
