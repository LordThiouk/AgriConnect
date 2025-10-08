import { useCache } from './useCache';
import { CooperativesService } from '../services/domain/cooperatives';
import { Cooperative, CooperativeFilters } from '../services/domain/cooperatives/cooperatives.types';

/**
 * Hook pour récupérer la liste des coopératives.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useCooperatives(filters?: CooperativeFilters, options = {}) {
  const key = `cooperatives:list:${JSON.stringify(filters || {})}`;
  
  const fetcher = async () => {
    console.log(`🚀 [useCooperatives] Fetching cooperatives list`);
    return CooperativesService.getAll(filters);
  };

  return useCache<Cooperative[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer une coopérative par son ID.
 * @param cooperativeId - L'ID de la coopérative.
 * @param options - Options de cache.
 */
export function useCooperativeById(cooperativeId: string | null, options = {}) {
  const key = cooperativeId ? `cooperatives:${cooperativeId}` : null;
  
  const fetcher = async () => {
    if (!cooperativeId) return null;
    console.log(`🚀 [useCooperativeById] Fetching cooperative: ${cooperativeId}`);
    return CooperativesService.getById(cooperativeId);
  };

  return useCache<Cooperative | null>(key, fetcher, options);
}
