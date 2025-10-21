/**
 * Cache spécifique pour les profils
 */

import { agriConnectCache } from '../../core/cache';
import { Profile } from './profiles.types';

export class ProfilesCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  async getMe(): Promise<Profile | null> {
    return agriConnectCache.get<Profile>('profiles:me');
  }

  async setMe(profile: Profile, ttl?: number): Promise<void> {
    await agriConnectCache.set('profiles:me', profile, ttl || this.DEFAULT_TTL);
  }

  async invalidateMe(): Promise<void> {
    await agriConnectCache.invalidate({ pattern: 'profiles:me' });
  }

  async getById(profileId: string): Promise<Profile | null> {
    return agriConnectCache.get<Profile>(`profiles:${profileId}`);
  }

  async setById(profileId: string, profile: Profile, ttl?: number): Promise<void> {
    await agriConnectCache.set(`profiles:${profileId}`, profile, ttl || this.DEFAULT_TTL);
  }

  async invalidateById(profileId: string): Promise<void> {
    await agriConnectCache.invalidate({ pattern: `profiles:${profileId}` });
  }
}


