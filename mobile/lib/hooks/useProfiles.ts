import { useCache } from './useCache';
import { ProfilesServiceInstance as ProfilesService } from '../services/domain/profiles';
import { Profile } from '../services/domain/profiles/profiles.types';

/**
 * Hook pour récupérer le profil de l'utilisateur courant.
 */
export function useMyProfile(options = {}) {
  const key = 'profiles:me';

  const fetcher = async () => {
    return ProfilesService.getMyProfile();
  };

  return useCache<Profile | null>(key, fetcher, options);
}

/**
 * Hook pour récupérer un profil par son ID.
 */
export function useProfileById(profileId: string | null, options = {}) {
  const key = profileId ? `profiles:${profileId}` : null;

  const fetcher = async () => {
    if (!profileId) return null;
    return ProfilesService.getProfileById(profileId);
  };

  return useCache<Profile | null>(key as any, fetcher, options);
}


