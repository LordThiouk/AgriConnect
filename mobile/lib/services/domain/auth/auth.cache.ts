/**
 * Cache spécifique pour l'authentification
 */

import { agriConnectCache } from '../../core/cache';
import { User, UserProfile, AuthSession } from './auth.types';

export class AuthCache {
  private PREFIX = 'auth';
  private TTL = 15 * 60 * 1000; // 15 minutes (sessions plus longues)

  /**
   * Récupère la session utilisateur depuis le cache
   */
  async getSession(): Promise<AuthSession | null> {
    const key = `${this.PREFIX}:session`;
    return await agriConnectCache.get<AuthSession>(key);
  }

  /**
   * Met en cache la session utilisateur
   */
  async setSession(
    session: AuthSession, 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:session`;
    await agriConnectCache.set(key, session, ttl || this.TTL );
  }

  /**
   * Récupère un utilisateur par son ID depuis le cache
   */
  async getUser(userId: string): Promise<User | null> {
    const key = `${this.PREFIX}:user:${userId}`;
    return await agriConnectCache.get<User>(key);
  }

  /**
   * Met en cache un utilisateur
   */
  async setUser(
    userId: string, 
    user: User, 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:user:${userId}`;
    await agriConnectCache.set(key, user, ttl || this.TTL );
  }

  /**
   * Récupère un profil utilisateur par son ID depuis le cache
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const key = `${this.PREFIX}:profile:${userId}`;
    return await agriConnectCache.get<UserProfile>(key);
  }

  /**
   * Met en cache un profil utilisateur
   */
  async setUserProfile(
    userId: string, 
    profile: UserProfile, 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:profile:${userId}`;
    await agriConnectCache.set(key, profile, ttl || this.TTL );
  }

  /**
   * Récupère les utilisateurs d'une coopérative depuis le cache
   */
  async getCooperativeUsers(cooperativeId: string): Promise<UserProfile[] | null> {
    const key = `${this.PREFIX}:cooperative:${cooperativeId}`;
    return await agriConnectCache.get<UserProfile[]>(key);
  }

  /**
   * Met en cache les utilisateurs d'une coopérative
   */
  async setCooperativeUsers(
    cooperativeId: string, 
    users: UserProfile[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:cooperative:${cooperativeId}`;
    await agriConnectCache.set(key, users, ttl || this.TTL );
  }

  /**
   * Récupère les utilisateurs par rôle depuis le cache
   */
  async getUsersByRole(role: string): Promise<UserProfile[] | null> {
    const key = `${this.PREFIX}:role:${role}`;
    return await agriConnectCache.get<UserProfile[]>(key);
  }

  /**
   * Met en cache les utilisateurs par rôle
   */
  async setUsersByRole(
    role: string, 
    users: UserProfile[], 
    ttl?: number
  ): Promise<void> {
    const key = `${this.PREFIX}:role:${role}`;
    await agriConnectCache.set(key, users, ttl || this.TTL );
  }

  /**
   * Invalide la session utilisateur
   */
  async invalidateSession(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:session` });
  }

  /**
   * Invalide le cache d'un utilisateur
   */
  async invalidateUser(userId: string): Promise<void> {
    const keys = [
      `${this.PREFIX}:user:${userId}`,
      `${this.PREFIX}:profile:${userId}`
    ];

    for (const key of keys) {
      await agriConnectCache.invalidate({ pattern: key });
    }
  }

  /**
   * Invalide le cache des utilisateurs d'une coopérative
   */
  async invalidateCooperativeCache(cooperativeId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:cooperative:${cooperativeId}` });
  }

  /**
   * Invalide le cache des utilisateurs par rôle
   */
  async invalidateRoleCache(role: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:role:${role}` });
  }

  /**
   * Invalide tout le cache d'authentification
   */
  async invalidateAllCache(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `${this.PREFIX}:*` });
  }
}
