import { useCache } from './useCache';
import { SeasonsServiceInstance as seasonsService } from '../services/domain/seasons';
import { Season, SeasonFilters, SeasonStats } from '../services/domain/seasons/seasons.types';

/**
 * Hook pour récupérer la saison active.
 * @param options - Options de cache.
 */
export function useActiveSeason(options = {}) {
  const key = 'seasons:active';

  const fetcher = async () => {
    console.log(`🚀 [useActiveSeason] Fetching active season`);
    return seasonsService.getActiveSeason();
  };

  return useCache<Season | null>(key, fetcher, options);
}

/**
 * Hook pour récupérer toutes les saisons.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useSeasons(filters?: SeasonFilters, options = {}) {
  const key = `seasons:list:${JSON.stringify(filters || {})}`;

  const fetcher = async () => {
    console.log(`🚀 [useSeasons] Fetching seasons list`);
    return seasonsService.getAll(filters);
  };

  return useCache<Season[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer les statistiques globales des saisons.
 * @param options - Options de cache.
 */
export function useSeasonStats(options = {}) {
  const key = 'seasons:stats';

  const fetcher = async () => {
    console.log(`🚀 [useSeasonStats] Fetching season stats`);
    return seasonsService.getStats();
  };

  return useCache<SeasonStats>(key, fetcher, options);
}
