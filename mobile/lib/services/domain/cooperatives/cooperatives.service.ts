/**
 * Service pour la gestion des coopératives
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { CooperativesCache } from './cooperatives.cache';
import {
  Cooperative,
  CooperativeCreate,
  CooperativeUpdate,
  CooperativeFilters,
  CooperativeStats,
  CooperativeWithStats
} from './cooperatives.types';

export class CooperativesService {
  private cache: CooperativesCache;

  constructor() {
    this.cache = new CooperativesCache(agriConnectCache);
  }

  /**
   * Récupérer toutes les coopératives avec filtres optionnels
   */
  async getAll(filters?: CooperativeFilters): Promise<Cooperative[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste coopératives');
        return cached;
      }

      console.log('🌾 Récupération des coopératives depuis la base');

      let query = supabase
        .from('cooperatives')
        .select('*')
        .order('name', { ascending: true });

      // Appliquer les filtres
      if (filters?.region) {
        query = query.eq('region', filters.region);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.commune) {
        query = query.eq('commune', filters.commune);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des coopératives:', error);
        throw error;
      }

      const cooperatives = data || [];
      
      // Mettre en cache
      await this.cache.setList(cooperatives, filters);
      
      console.log(`✅ ${cooperatives.length} coopératives récupérées`);
      return cooperatives;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer une coopérative par ID
   */
  async getById(id: string): Promise<Cooperative | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour coopérative:', id);
        return cached;
      }

      console.log('🌾 Récupération de la coopérative:', id);

      const { data, error } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Coopérative non trouvée:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la coopérative:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Coopérative récupérée:', data?.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer une coopérative avec ses statistiques
   */
  async getByIdWithStats(id: string): Promise<CooperativeWithStats | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithStats(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour coopérative avec stats:', id);
        return cached;
      }

      console.log('🌾 Récupération de la coopérative avec stats:', id);

      // Récupérer la coopérative
      const cooperative = await this.getById(id);
      if (!cooperative) {
        return null;
      }

      // Récupérer les statistiques
      const [producersResult, plotsResult, farmFilesResult] = await Promise.all([
        supabase
          .from('producers')
          .select('id', { count: 'exact' })
          .eq('cooperative_id', id),
        supabase
          .from('plots')
          .select('id', { count: 'exact' })
          .eq('cooperative_id', id),
        supabase
          .from('farm_files')
          .select('id', { count: 'exact' })
          .eq('cooperative_id', id)
      ]);

      const stats = {
        total_producers: producersResult.count || 0,
        total_plots: plotsResult.count || 0,
        total_farm_files: farmFilesResult.count || 0,
        last_activity: cooperative.updated_at
      };

      const result: CooperativeWithStats = {
        ...cooperative,
        stats
      };

      // Mettre en cache
      await this.cache.setItemWithStats(id, result);

      console.log('✅ Coopérative avec stats récupérée:', cooperative.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.getByIdWithStats:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle coopérative
   */
  async create(data: CooperativeCreate): Promise<Cooperative> {
    try {
      console.log('🌾 Création d\'une nouvelle coopérative:', data.name);

      const { data: result, error } = await supabase
        .from('cooperatives')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la coopérative:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Coopérative créée:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.create:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une coopérative
   */
  async update(id: string, data: CooperativeUpdate): Promise<Cooperative> {
    try {
      console.log('🌾 Mise à jour de la coopérative:', id);

      const { data: result, error } = await supabase
        .from('cooperatives')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la coopérative:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Coopérative mise à jour:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer une coopérative
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('🌾 Suppression de la coopérative:', id);

      const { error } = await supabase
        .from('cooperatives')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la coopérative:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Coopérative supprimée:', id);

    } catch (error) {
      console.error('❌ Erreur CooperativesService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des coopératives
   */
  async getStats(): Promise<CooperativeStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats coopératives');
        return cached;
      }

      console.log('🌾 Récupération des statistiques des coopératives');

      const { data, error } = await supabase
        .from('cooperatives')
        .select('id, status, region, department');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const cooperatives = data || [];
      
      const stats: CooperativeStats = {
        total_cooperatives: cooperatives.length,
        active_cooperatives: cooperatives.filter(c => c.status === 'active').length,
        inactive_cooperatives: cooperatives.filter(c => c.status === 'inactive').length,
        suspended_cooperatives: cooperatives.filter(c => c.status === 'suspended').length,
        by_region: cooperatives.reduce((acc, c) => {
          if (c.region) {
            acc[c.region] = (acc[c.region] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        by_department: cooperatives.reduce((acc, c) => {
          if (c.department) {
            acc[c.department] = (acc[c.department] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des coopératives récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur CooperativesService.getStats:', error);
      throw error;
    }
  }
}

export const CooperativesServiceInstance = new CooperativesService();
