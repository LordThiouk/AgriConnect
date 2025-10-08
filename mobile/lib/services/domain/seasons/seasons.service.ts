/**
 * Service pour la gestion des saisons (RPC)
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { SeasonsCache } from './seasons.cache';
import {
  Season,
  SeasonCreate,
  SeasonUpdate,
  SeasonFilters,
  SeasonStats,
  SeasonWithDetails,
  SeasonCropStats,
  SeasonRegionStats
} from './seasons.types';

class SeasonsService {
  private cache: SeasonsCache;

  constructor() {
    this.cache = new SeasonsCache(agriConnectCache);
  }

  /**
   * Récupérer toutes les saisons avec filtres optionnels
   */
  async getAll(filters?: SeasonFilters): Promise<Season[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste saisons');
        return cached;
      }

      console.log('🌱 Récupération des saisons depuis la base');

      let query = supabase
        .from('seasons')
        .select('*')
        .order('year', { ascending: false })
        .order('start_date', { ascending: false });

      // Appliquer les filtres
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.date_from) {
        query = query.gte('start_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('end_date', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des saisons:', error);
        throw error;
      }

      const seasons = data || [];
      
      // Mettre en cache
      await this.cache.setList(seasons, filters);
      
      console.log(`✅ ${seasons.length} saisons récupérées`);
      return seasons;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer une saison par ID
   */
  async getById(id: string): Promise<Season | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour saison:', id);
        return cached;
      }

      console.log('🌱 Récupération de la saison:', id);

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Saison non trouvée:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la saison:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Saison récupérée:', data?.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer la saison active
   */
  async getActiveSeason(): Promise<Season | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getActiveSeason();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour saison active');
        return cached;
      }

      console.log('🌱 Récupération de la saison active');

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Aucune saison active trouvée');
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la saison active:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setActiveSeason(data);
      }

      console.log('✅ Saison active récupérée:', data?.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getActiveSeason:', error);
      throw error;
    }
  }

  /**
   * Récupérer les saisons par année
   */
  async getByYear(year: number): Promise<Season[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByYear(year);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour saisons année:', year);
        return cached;
      }

      console.log('🌱 Récupération des saisons pour l\'année:', year);

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('year', year)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des saisons:', error);
        throw error;
      }

      const seasons = data || [];

      // Mettre en cache
      await this.cache.setByYear(year, seasons);

      console.log(`✅ ${seasons.length} saisons récupérées pour l'année ${year}`);
      return seasons;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getByYear:', error);
      throw error;
    }
  }

  /**
   * Récupérer une saison avec ses détails
   */
  async getByIdWithDetails(id: string): Promise<SeasonWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour saison avec détails:', id);
        return cached;
      }

      console.log('🌱 Récupération de la saison avec détails:', id);

      // Récupérer la saison
      const season = await this.getById(id);
      if (!season) {
        return null;
      }

      // Récupérer les statistiques
      const [cropsResult, plotsResult, operationsResult, observationsResult, visitsResult] = await Promise.all([
        supabase
          .from('crops')
          .select('id', { count: 'exact' })
          .eq('season_id', id),
        supabase
          .from('plots')
          .select('id', { count: 'exact' })
          .eq('season_id', id),
        supabase
          .from('operations')
          .select('id', { count: 'exact' })
          .eq('season_id', id),
        supabase
          .from('observations')
          .select('id', { count: 'exact' })
          .eq('season_id', id),
        supabase
          .from('visits')
          .select('id', { count: 'exact' })
          .eq('season_id', id)
      ]);

      const stats = {
        total_crops: cropsResult.count || 0,
        total_plots: plotsResult.count || 0,
        total_operations: operationsResult.count || 0,
        total_observations: observationsResult.count || 0,
        total_visits: visitsResult.count || 0
      };

      const result: SeasonWithDetails = {
        ...season,
        stats
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Saison avec détails récupérée:', season.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle saison
   */
  async create(data: SeasonCreate): Promise<Season> {
    try {
      console.log('🌱 Création d\'une nouvelle saison:', data.name);

      const { data: result, error } = await supabase
        .from('seasons')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la saison:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateByYear(result.year);
      await this.cache.invalidateStats();

      console.log('✅ Saison créée:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.create:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une saison
   */
  async update(id: string, data: SeasonUpdate): Promise<Season> {
    try {
      console.log('🌱 Mise à jour de la saison:', id);

      const { data: result, error } = await supabase
        .from('seasons')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la saison:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateByYear(result.year);
      await this.cache.invalidateStats();
      if (result.is_active) {
        await this.cache.invalidateActiveSeason();
      }

      console.log('✅ Saison mise à jour:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer une saison
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('🌱 Suppression de la saison:', id);

      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la saison:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Saison supprimée:', id);

    } catch (error) {
      console.error('❌ Erreur SeasonsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des saisons
   */
  async getStats(): Promise<SeasonStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats saisons');
        return cached;
      }

      console.log('🌱 Récupération des statistiques des saisons');

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const seasons = data || [];
      const currentDate = new Date();
      
      const stats: SeasonStats = {
        total_seasons: seasons.length,
        active_seasons: seasons.filter(s => s.is_active).length,
        inactive_seasons: seasons.filter(s => !s.is_active).length,
        by_year: seasons.reduce((acc, s) => {
          acc[s.year] = (acc[s.year] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        current_season: seasons.find(s => s.is_active) || undefined,
        upcoming_seasons: seasons.filter(s => new Date(s.start_date) > currentDate),
        past_seasons: seasons.filter(s => new Date(s.end_date) < currentDate)
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des saisons récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getStats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des cultures par saison
   */
  async getCropStats(seasonId: string): Promise<SeasonCropStats[]> {
    try {
      console.log('🌱 Récupération des statistiques des cultures pour la saison:', seasonId);

      const { data, error } = await supabase
        .from('crops')
        .select(`
          crop_type,
          area_hectares,
          actual_yield_kg,
          plots!inner(id),
          operations(id),
          observations(id)
        `)
        .eq('season_id', seasonId);

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats cultures:', error);
        throw error;
      }

      const crops = data || [];
      
      // Grouper par type de culture
      const cropStatsMap = new Map<string, SeasonCropStats>();
      
      crops.forEach(crop => {
        const key = crop.crop_type;
        if (!cropStatsMap.has(key)) {
          cropStatsMap.set(key, {
            season_id: seasonId,
            crop_type: key,
            total_plots: 0,
            total_area: 0,
            average_yield: 0,
            total_operations: 0,
            total_observations: 0
          });
        }
        
        const stats = cropStatsMap.get(key)!;
        stats.total_plots += 1;
        stats.total_area += crop.area_hectares || 0;
        stats.total_operations += crop.operations?.length || 0;
        stats.total_observations += crop.observations?.length || 0;
        
        if (crop.actual_yield_kg) {
          stats.average_yield = (stats.average_yield + crop.actual_yield_kg) / 2;
        }
      });

      const result = Array.from(cropStatsMap.values());
      console.log(`✅ ${result.length} statistiques de cultures récupérées`);
      return result;

    } catch (error) {
      console.error('❌ Erreur SeasonsService.getCropStats:', error);
      throw error;
    }
  }
}

export const SeasonsServiceInstance = new SeasonsService();
