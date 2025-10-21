/**
 * ProfilesService - Service pour la gestion des profils utilisateurs
 */

import { supabase } from '../../../../lib/supabase-client';
import { ProfilesCache } from './profiles.cache';
import { Profile, ProfileUpdateInput } from './profiles.types';

export class ProfilesService {
  private cache = new ProfilesCache();

  async getMyProfile(): Promise<Profile | null> {
    const cached = await this.cache.getMe();
    if (cached) {
      return cached;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return null;
    }

    await this.cache.setMe(data as Profile);
    return data as Profile;
  }

  async getProfileById(profileId: string): Promise<Profile | null> {
    const cached = await this.cache.getById(profileId);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      return null;
    }

    await this.cache.setById(profileId, data as Profile);
    return data as Profile;
  }

  async updateMyProfile(input: ProfileUpdateInput): Promise<Profile> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw userError || new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...input })
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await this.cache.setMe(data as Profile);
    if (data?.id) {
      await this.cache.setById(data.id, data as Profile);
    }
    return data as Profile;
  }
}

export const ProfilesServiceInstance = new ProfilesService();


