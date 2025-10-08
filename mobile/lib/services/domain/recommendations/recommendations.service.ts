/**
 * Service pour la gestion des recommandations agricoles
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { RecommendationsCache } from './recommendations.cache';
import {
  Recommendation,
  RecommendationCreate,
  RecommendationUpdate,
  RecommendationFilters,
  RecommendationStats,
  RecommendationWithDetails,
  RecommendationAssignment,
  RecommendationFeedback
} from './recommendations.types';

class RecommendationsService {
  private cache: RecommendationsCache;

  constructor() {
    this.cache = new RecommendationsCache(agriConnectCache);
  }

  /**
   * Récupérer toutes les recommandations avec filtres optionnels
   */
  async getAll(filters?: RecommendationFilters): Promise<Recommendation[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste recommandations');
        return cached;
      }

      console.log('💡 Récupération des recommandations depuis la base');

      let query = supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.applicable_crops && filters.applicable_crops.length > 0) {
        query = query.overlaps('applicable_crops', filters.applicable_crops);
      }
      if (filters?.applicable_regions && filters.applicable_regions.length > 0) {
        query = query.overlaps('applicable_regions', filters.applicable_regions);
      }
      if (filters?.applicable_seasons && filters.applicable_seasons.length > 0) {
        query = query.overlaps('applicable_seasons', filters.applicable_seasons);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des recommandations:', error);
        throw error;
      }

      const recommendations = data || [];
      
      // Mettre en cache
      await this.cache.setList(recommendations, filters);
      
      console.log(`✅ ${recommendations.length} recommandations récupérées`);
      return recommendations;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer les recommandations pour un utilisateur (producteur/agent)
   */
  async getByUserId(userId: string, filters?: RecommendationFilters): Promise<Recommendation[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getUserRecommendations(userId, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandations utilisateur:', userId);
        return cached;
      }

      console.log('💡 Récupération des recommandations pour utilisateur:', userId);

      // Récupérer les recommandations générales + spécifiques à l'utilisateur
      const userFilters = { ...filters };
      const recommendations = await this.getAll(userFilters);

      // Filtrer les recommandations applicables à l'utilisateur
      // (logique de filtrage basée sur la région, les cultures, etc.)
      const applicableRecommendations = recommendations.filter(rec => {
        // Logique de filtrage à implémenter selon les besoins
        return true; // Pour l'instant, retourner toutes les recommandations
      });

      // Mettre en cache spécifique à l'utilisateur
      await this.cache.setUserRecommendations(userId, applicableRecommendations, filters);

      console.log(`✅ ${applicableRecommendations.length} recommandations applicables pour l'utilisateur`);
      return applicableRecommendations;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getByUserId:', error);
      throw error;
    }
  }

  /**
   * Récupérer une recommandation par ID
   */
  async getById(id: string): Promise<Recommendation | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandation:', id);
        return cached;
      }

      console.log('💡 Récupération de la recommandation:', id);

      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Recommandation non trouvée:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la recommandation:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Recommandation récupérée:', data?.title);
      return data;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer une recommandation avec détails
   */
  async getByIdWithDetails(id: string): Promise<RecommendationWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandation avec détails:', id);
        return cached;
      }

      console.log('💡 Récupération de la recommandation avec détails:', id);

      // Récupérer la recommandation
      const recommendation = await this.getById(id);
      if (!recommendation) {
        return null;
      }

      // Récupérer les détails du créateur
      let createdByName = '';
      if (recommendation.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', recommendation.created_by)
          .single();
        
        if (profile) {
          createdByName = profile.display_name;
        }
      }

      const result: RecommendationWithDetails = {
        ...recommendation,
        created_by_name: createdByName
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Recommandation avec détails récupérée:', recommendation.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle recommandation
   */
  async create(data: RecommendationCreate): Promise<Recommendation> {
    try {
      console.log('💡 Création d\'une nouvelle recommandation:', data.title);

      const { data: result, error } = await supabase
        .from('recommendations')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la recommandation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Recommandation créée:', result.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.create:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une recommandation
   */
  async update(id: string, data: RecommendationUpdate): Promise<Recommendation> {
    try {
      console.log('💡 Mise à jour de la recommandation:', id);

      const { data: result, error } = await supabase
        .from('recommendations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la recommandation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Recommandation mise à jour:', result.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer une recommandation
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('💡 Suppression de la recommandation:', id);

      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la recommandation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Recommandation supprimée:', id);

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer les recommandations par type
   */
  async getByType(type: string, filters?: RecommendationFilters): Promise<Recommendation[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByType(type, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandations par type:', type);
        return cached;
      }

      console.log('💡 Récupération des recommandations par type:', type);

      const typeFilters = { ...filters, type };
      const recommendations = await this.getAll(typeFilters);

      // Mettre en cache par type
      await this.cache.setByType(type, recommendations, filters);

      console.log(`✅ ${recommendations.length} recommandations de type ${type} récupérées`);
      return recommendations;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getByType:', error);
      throw error;
    }
  }

  /**
   * Récupérer les recommandations par région
   */
  async getByRegion(region: string, filters?: RecommendationFilters): Promise<Recommendation[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByRegion(region, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandations par région:', region);
        return cached;
      }

      console.log('💡 Récupération des recommandations par région:', region);

      const regionFilters = { ...filters, applicable_regions: [region] };
      const recommendations = await this.getAll(regionFilters);

      // Mettre en cache par région
      await this.cache.setByRegion(region, recommendations, filters);

      console.log(`✅ ${recommendations.length} recommandations pour la région ${region} récupérées`);
      return recommendations;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getByRegion:', error);
      throw error;
    }
  }

  /**
   * Récupérer les recommandations par culture
   */
  async getByCrop(crop: string, filters?: RecommendationFilters): Promise<Recommendation[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByCrop(crop, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour recommandations par culture:', crop);
        return cached;
      }

      console.log('💡 Récupération des recommandations par culture:', crop);

      const cropFilters = { ...filters, applicable_crops: [crop] };
      const recommendations = await this.getAll(cropFilters);

      // Mettre en cache par culture
      await this.cache.setByCrop(crop, recommendations, filters);

      console.log(`✅ ${recommendations.length} recommandations pour la culture ${crop} récupérées`);
      return recommendations;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getByCrop:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des recommandations
   */
  async getStats(): Promise<RecommendationStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats recommandations');
        return cached;
      }

      console.log('💡 Récupération des statistiques des recommandations');

      const { data, error } = await supabase
        .from('recommendations')
        .select('type, priority, status, applicable_regions, applicable_crops');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const recommendations = data || [];
      
      const stats: RecommendationStats = {
        total_recommendations: recommendations.length,
        pending_recommendations: recommendations.filter(r => r.status === 'pending').length,
        accepted_recommendations: recommendations.filter(r => r.status === 'accepted').length,
        rejected_recommendations: recommendations.filter(r => r.status === 'rejected').length,
        implemented_recommendations: recommendations.filter(r => r.status === 'implemented').length,
        expired_recommendations: recommendations.filter(r => r.status === 'expired').length,
        by_type: recommendations.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_priority: recommendations.reduce((acc, r) => {
          acc[r.priority] = (acc[r.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: recommendations.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_region: recommendations.reduce((acc, r) => {
          r.applicable_regions?.forEach(region => {
            acc[region] = (acc[region] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        by_crop: recommendations.reduce((acc, r) => {
          r.applicable_crops?.forEach(crop => {
            acc[crop] = (acc[crop] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des recommandations récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur RecommendationsService.getStats:', error);
      throw error;
    }
  }

  /**
   * Récupère les conseils (recommandations) pour une parcelle (méthode manquante de CollecteService)
   */
  async getRecommendationsByPlotId(plotId: string): Promise<any[]> {
    try {
      console.log('💡 [RecommendationsService] Récupération des conseils pour la parcelle:', plotId);

      // D'abord récupérer le producer_id depuis plots
      const { data: plotData, error: plotError } = await supabase
        .from('plots')
        .select('producer_id')
        .eq('id', plotId)
        .single();

      if (plotError || !plotData) {
        console.log('   ⚠️ Parcelle non trouvée, recherche sans producer_id filtré');
        const { data: noFilters, error: noFiltersError } = await supabase
          .from('recommendations')
          .select('*')
          .eq('plot_id', plotId)
          .order('created_at', { ascending: false });

        if (noFiltersError) {
          console.error('❌ [RecommendationsService] Erreur lors de la récupération des conseils:', noFiltersError);
          throw noFiltersError;
        }

        return !noFilters ? [] : noFilters.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          date: new Date(r.created_at || Date.now()).toLocaleDateString('fr-FR'),
          status: (r.status || 'pending') as string,
          type: r.recommendation_type,
        }));
      }

      const producerId = plotData.producer_id;
      console.log('   📋 Producer ID récupéré:', producerId);

      // Recherche les recommandations avec ce producer_id et optionnellement matching ideal plotId ou null
      let dataQuery = supabase
        .from('recommendations')
        .select('*')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

      const { data, error } = await dataQuery;

      if (error) {
        console.error('❌ [RecommendationsService] Erreur lors de la récupération des conseils:', error);
        throw error;
      }

      if (!data) return [];

      return data
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          date: new Date(r.created_at || Date.now()).toLocaleDateString('fr-FR'),
          status: (r.status || 'pending') as string,
          type: r.recommendation_type,
        }));
    } catch (error) {
      console.error('❌ [RecommendationsService] Erreur générale dans getRecommendationsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Récupère les 3 derniers conseils pour une parcelle (méthode manquante de CollecteService)
   */
  async getLatestRecommendations(plotId: string): Promise<any[]> {
    try {
      console.log('💡 [RecommendationsService] Récupération des derniers conseils pour la parcelle:', plotId);

      // D'abord récupérer le producer_id depuis plots 
      const { data: plotData, error: plotError } = await supabase
        .from('plots')
        .select('producer_id')
        .eq('id', plotId)
        .single();

      if (plotError || !plotData) {
        console.log('   ⚠️ Parcelle non trouvée, recherche des 3 dernières recommandations sans producer_id filtré');
        
        const { data: noFilters, error: noFiltersError } = await supabase
          .from('recommendations')
          .select('*')
          .eq('plot_id', plotId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (noFiltersError) {
          console.error('❌ [RecommendationsService] Erreur récupération colonnes recommendations:', noFiltersError);
          return [];
        }
        
        return !noFilters ? [] : noFilters.map(rec => ({
          id: rec.id,
          title: rec.title,
          message: rec.message,
          type: rec.recommendation_type,
          status: rec.status,
          date: rec.created_at ? new Date(rec.created_at).toLocaleDateString('fr-FR') : 'N/A',
        }));
      }

      const producerId = plotData.producer_id;
      console.log('   📋 Producer ID récupéré:', producerId);

      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('❌ [RecommendationsService] Erreur récupération des derniers conseils via producer:', error);
        return [];
      }
      
      return !data ? [] : data.map(rec => ({
        id: rec.id,
        title: rec.title,
        message: rec.message,
        type: rec.recommendation_type,
        status: rec.status,
        date: rec.created_at ? new Date(rec.created_at).toLocaleDateString('fr-FR') : 'N/A',
      }));
    } catch (err) {
      console.error('❌ [RecommendationsService] Exception in getLatestRecommendations:', err);
      return [];
    }
  }
}

export const RecommendationsServiceInstance = new RecommendationsService();
