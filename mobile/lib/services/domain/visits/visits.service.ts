/**
 * Service de gestion des visites - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { AgriConnectApiClientInstance } from '../../core/api';
import { VisitsCache } from './visits.cache';
import {
  Visit,
  VisitUpdateData,
  VisitInsert,
  VisitServiceOptions,
  VisitStats
} from './visits.types';

class VisitsService {
  private supabase: SupabaseClient = supabase;
  private cache = new VisitsCache();

  /**
   * Récupère les visites d'un agent avec cache
   */
  async getAgentVisits(
    agentId: string,
    options: VisitServiceOptions = {}
  ): Promise<Visit[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📅 [VisitsService] Récupération des visites pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedVisits = await this.cache.getAgentVisits(agentId);
      if (cachedVisits) {
        console.log(`⚡ [VisitsService] Cache HIT: ${cachedVisits.length} visites pour l'agent ${agentId}`);
        return cachedVisits;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les visites de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: { p_user_id: agentId },
        method: 'POST',
        cache: useCache ? cacheTTL : false
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_agent_all_visits_with_filters:', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] ${Array.isArray(data) ? data.length : 0} visites récupérées en ${responseTime}ms`);

      const visits = Array.isArray(data) ? data.map((visit: any) => this.formatVisitData(visit)) : [];

      // Mettre en cache si activé
      if (useCache && visits.length > 0) {
        await this.cache.setAgentVisits(agentId, visits, cacheTTL);
      }

      return visits;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération des visites de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Récupère les visites du jour d'un agent avec cache
   */
  async getTodayVisits(
    agentId: string,
    options: VisitServiceOptions = {}
  ): Promise<Visit[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📅 [VisitsService] Récupération des visites du jour pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedVisits = await this.cache.getTodayVisits(agentId);
      if (cachedVisits) {
        console.log(`⚡ [VisitsService] Cache HIT: ${cachedVisits.length} visites du jour pour l'agent ${agentId}`);
        return cachedVisits;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les visites du jour de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts avec filtre "today"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentId,
          p_filter: 'today'
        },
        method: 'POST',
        cache: useCache ? cacheTTL : false
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_agent_all_visits_with_filters (today):', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] ${Array.isArray(data) ? data.length : 0} visites du jour récupérées en ${responseTime}ms`);

      const visits = Array.isArray(data) ? data.map((visit: any) => this.formatVisitData(visit)) : [];

      // Mettre en cache si activé
      if (useCache && visits.length > 0) {
        await this.cache.setTodayVisits(agentId, visits, cacheTTL);
      }

      return visits;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération des visites du jour:', error);
      throw error;
    }
  }

  /**
   * Récupère les visites à venir d'un agent avec cache
   */
  async getUpcomingVisits(
    agentId: string,
    options: VisitServiceOptions = {}
  ): Promise<Visit[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📅 [VisitsService] Récupération des visites à venir pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedVisits = await this.cache.getUpcomingVisits(agentId);
      if (cachedVisits) {
        console.log(`⚡ [VisitsService] Cache HIT: ${cachedVisits.length} visites à venir pour l'agent ${agentId}`);
        return cachedVisits;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les visites à venir de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts avec filtre "upcoming"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentId,
          p_filter: 'upcoming'
        },
        method: 'POST',
        cache: useCache ? cacheTTL : false
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_agent_all_visits_with_filters (upcoming):', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] ${Array.isArray(data) ? data.length : 0} visites à venir récupérées en ${responseTime}ms`);

      const visits = Array.isArray(data) ? data.map((visit: any) => this.formatVisitData(visit)) : [];

      // Mettre en cache si activé
      if (useCache && visits.length > 0) {
        await this.cache.setUpcomingVisits(agentId, visits, cacheTTL);
      }

      return visits;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération des visites à venir:', error);
      throw error;
    }
  }

  /**
   * Récupère les visites passées d'un agent avec cache
   */
  async getPastVisits(
    agentId: string,
    options: VisitServiceOptions = {}
  ): Promise<Visit[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📅 [VisitsService] Récupération des visites passées pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedVisits = await this.cache.getPastVisits(agentId);
      if (cachedVisits) {
        console.log(`⚡ [VisitsService] Cache HIT: ${cachedVisits.length} visites passées pour l'agent ${agentId}`);
        return cachedVisits;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les visites passées de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts avec filtre "past"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentId,
          p_filter: 'past'
        },
        method: 'POST',
        cache: useCache ? cacheTTL : false
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_agent_all_visits_with_filters (past):', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] ${Array.isArray(data) ? data.length : 0} visites passées récupérées en ${responseTime}ms`);

      const visits = Array.isArray(data) ? data.map((visit: any) => this.formatVisitData(visit)) : [];

      // Mettre en cache si activé
      if (useCache && visits.length > 0) {
        await this.cache.setPastVisits(agentId, visits, cacheTTL);
      }

      return visits;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération des visites passées:', error);
      throw error;
    }
  }

  /**
   * Récupère une visite par son ID avec cache
   */
  async getVisitById(
    visitId: string,
    options: VisitServiceOptions = {}
  ): Promise<Visit | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [VisitsService] Récupération de la visite:', visitId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedVisit = await this.cache.getVisit(visitId);
      if (cachedVisit) {
        console.log(`⚡ [VisitsService] Cache HIT pour la visite ${visitId}`);
        return cachedVisit;
      }
      console.log(`❌ [VisitsService] Cache MISS pour la visite ${visitId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('visits')
        .select('*')
        .eq('id', visitId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ [VisitsService] Visite ${visitId} non trouvée`);
          return null;
        }
        console.error('❌ [VisitsService] Erreur lors de la récupération de la visite:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Visite récupérée en ${responseTime}ms`);

      const visit = this.formatVisitData(data);

      // Mettre en cache si activé
      if (useCache && visit) {
        await this.cache.setVisit(visitId, visit, cacheTTL);
      }

      return visit;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération de la visite:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle visite et invalide le cache
   */
  async createVisit(
    agentId: string,
    visitData: VisitInsert,
    options: VisitServiceOptions = {}
  ): Promise<Visit> {
    console.log('➕ [VisitsService] Création d\'une nouvelle visite pour l\'agent:', agentId);

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts
      const { data, error } = await this.supabase.rpc('create_visit', {
        p_agent_id: agentId,
        p_visit_data: visitData
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur lors de la création de la visite:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la création de la visite');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Visite créée en ${responseTime}ms`);

      const visit = this.formatVisitData(data.data);

      // Invalider le cache
      await this.cache.invalidateAgentCache(agentId);
      await this.cache.invalidatePlotCache(visit.plot_id);

      return visit;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la création de la visite:', error);
      throw error;
    }
  }

  /**
   * Met à jour une visite et invalide le cache
   */
  async updateVisit(
    visitId: string,
    updateData: VisitUpdateData,
    options: VisitServiceOptions = {}
  ): Promise<Visit> {
    console.log('✏️ [VisitsService] Mise à jour de la visite:', visitId);

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts
      const { data, error } = await this.supabase.rpc('update_visit', {
        p_visit_id: visitId,
        p_visit_data: updateData
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur lors de la mise à jour de la visite:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la mise à jour de la visite');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Visite mise à jour en ${responseTime}ms`);

      const visit = this.formatVisitData(data.data);

      // Invalider le cache
      await this.cache.invalidateVisitCache(visitId);
      await this.cache.invalidateAgentCache(visit.agent_id);
      await this.cache.invalidatePlotCache(visit.plot_id);

      return visit;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la mise à jour de la visite:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une visite et invalide le cache
   */
  async updateVisitStatus(
    visitId: string,
    status: string,
    options: VisitServiceOptions = {}
  ): Promise<void> {
    console.log('📝 [VisitsService] Mise à jour du statut de la visite:', visitId, '->', status);

    try {
      const startTime = Date.now();
      
      const { error } = await this.supabase
        .from('visits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) {
        console.error('❌ [VisitsService] Erreur lors de la mise à jour du statut:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Statut mis à jour en ${responseTime}ms`);

      // Invalider le cache
      await this.cache.invalidateVisitCache(visitId);
      
      // Récupérer l'agent_id pour invalider son cache
      const { data: visit } = await this.supabase
        .from('visits')
        .select('agent_id, plot_id')
        .eq('id', visitId)
        .single();
        
      if (visit) {
        await this.cache.invalidateAgentCache(visit.agent_id);
        await this.cache.invalidatePlotCache(visit.plot_id);
      }
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  /**
   * Supprime une visite et invalide le cache
   */
  async deleteVisit(
    visitId: string,
    options: VisitServiceOptions = {}
  ): Promise<void> {
    console.log('🗑️ [VisitsService] Suppression de la visite:', visitId);

    try {
      // Récupérer l'agent_id et plot_id avant suppression pour invalider le cache
      const { data: visitData } = await this.supabase
        .from('visits')
        .select('agent_id, plot_id')
        .eq('id', visitId)
        .single();

      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts
      const { data, error } = await this.supabase.rpc('delete_visit', {
        p_visit_id: visitId
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur lors de la suppression de la visite:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la suppression de la visite');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Visite supprimée en ${responseTime}ms`);

      // Invalider le cache
      await this.cache.invalidateVisitCache(visitId);
      if (visitData) {
        await this.cache.invalidateAgentCache(visitData.agent_id);
        await this.cache.invalidatePlotCache(visitData.plot_id);
      }
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la suppression de la visite:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des visites d'un agent avec cache
   */
  async getVisitStats(
    agentId: string,
    options: VisitServiceOptions = {}
  ): Promise<VisitStats> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📊 [VisitsService] Récupération des statistiques pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedStats = await this.cache.getVisitStats(agentId);
      if (cachedStats) {
        console.log(`⚡ [VisitsService] Cache HIT pour les statistiques de l'agent ${agentId}`);
        return cachedStats;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les statistiques de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Récupérer toutes les visites pour calculer les statistiques
      const visits = await this.getAgentVisits(agentId, { useCache: false });
      
      const today = new Date().toISOString().split('T')[0];
      const stats: VisitStats = {
        total: visits.length,
        completed: visits.filter(v => v.status === 'completed').length,
        pending: visits.filter(v => v.status === 'pending').length,
        today: visits.filter(v => v.visit_date.split('T')[0] === today).length,
        upcoming: visits.filter(v => v.visit_date > new Date().toISOString()).length,
        past: visits.filter(v => v.visit_date < new Date().toISOString()).length
      };

      const responseTime = Date.now() - startTime;
      console.log(`✅ [VisitsService] Statistiques calculées en ${responseTime}ms`);

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setVisitStats(agentId, stats, cacheTTL);
      }

      return stats;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  /**
   * Formate les données d'une visite
   */
  private formatVisitData(data: any): Visit {
    return {
      id: data.id,
      agent_id: data.agent_id,
      plot_id: data.plot_id,
      visit_type: data.visit_type,
      visit_date: data.visit_date,
      notes: data.notes,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      plot_name: data.plots?.name,
      producer_name: data.plots?.producers?.name,
      cooperative_name: data.plots?.producers?.cooperatives?.name,
      agent_name: data.profiles?.display_name,
      parcel_area: data.plots?.area_ha,
      parcel_location: data.plots?.location
    };
  }

  /**
   * Invalide le cache des visites d'une parcelle
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    console.log('🗑️ [VisitsService] Invalidation du cache pour la parcelle:', plotId);
    await this.cache.invalidatePlotCache(plotId);
  }

  /**
   * Invalide le cache des visites d'un agent
   */
  async invalidateAgentCache(agentId: string): Promise<void> {
    console.log('🗑️ [VisitsService] Invalidation du cache pour l\'agent:', agentId);
    await this.cache.invalidateAgentCache(agentId);
  }

  /**
   * Invalide tout le cache des visites
   */
  async invalidateAllCache(): Promise<void> {
    console.log('🗑️ [VisitsService] Invalidation de tout le cache des visites');
    await this.cache.invalidateAllCache();
  }

  /**
   * Récupère une visite pour édition avec toutes les données associées
   */
  async getVisitForEdit(visitId: string): Promise<any> {
    console.log('🔍 [VisitsService] Récupération de la visite pour édition:', visitId);

    try {
      const { data, error } = await this.supabase
        .rpc('get_visit_for_edit', {
          p_visit_id: visitId
        });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_visit_for_edit:', error);
        throw error;
      }

      console.log('✅ [VisitsService] Visite récupérée pour édition:', data?.visit?.id);
      return data;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors de la récupération de la visite:', error);
      throw error;
    }
  }

  /**
   * Marque une visite comme terminée
   */
  async markVisitAsCompleted(visitId: string): Promise<void> {
    console.log('✅ [VisitsService] Marquage de la visite comme terminée:', visitId);

    try {
      const { error } = await this.supabase
        .from('visits')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) {
        console.error('❌ [VisitsService] Erreur lors du marquage:', error);
        throw error;
      }

      console.log('✅ [VisitsService] Visite marquée comme terminée');
    } catch (error) {
      console.error('❌ [VisitsService] Erreur lors du marquage de la visite:', error);
      throw error;
    }
  }

  /**
   * Récupère une visite par son ID (méthode manquante de CollecteService)
   */
  async getVisitById(visitId: string): Promise<any> {
    try {
      console.log(`🔍 [VisitsService] Récupération de la visite: ${visitId}`);
      
      const { data, error } = await this.supabase
        .from('visits')
        .select(`
          *,
          agent:profiles!agent_id (
            id,
            phone,
            display_name
          ),
          producer:producers!producer_id (
            id,
            first_name,
            last_name,
            phone
          ),
          plot:plots!plot_id (
            id,
            name_season_snapshot,
            area_hectares
          )
        `)
        .eq('id', visitId)
        .maybeSingle();

      if (error) {
        console.error("❌ [VisitsService] Erreur lors de la récupération de la visite:", error);
        throw error;
      }

      if (!data) {
        console.warn(`⚠️ [VisitsService] Aucune visite trouvée avec l'ID ${visitId} (RLS ou visite inexistante)`);
        return null;
      }

      console.log('✅ [VisitsService] Visite récupérée:', data);
      return data;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur générale dans getVisitById:', error);
      throw error;
    }
  }

  /**
   * Met à jour une visite complète via RPC (méthode manquante de CollecteService)
   */
  async updateVisit(visitId: string, visitData: any): Promise<any> {
    try {
      console.log(`📝 [VisitsService] Mise à jour de la visite via RPC: ${visitId}`);
      
      const { data, error } = await this.supabase
        .rpc('update_visit', {
          p_visit_id: visitId,
          p_visit_data: visitData
        });

      if (error) {
        console.error("❌ [VisitsService] Erreur lors de la mise à jour de la visite:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la mise à jour de la visite');
      }
      
      console.log('✅ [VisitsService] Visite mise à jour via RPC');
      return data.data;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur générale dans updateVisit:', error);
      throw error;
    }
  }

  /**
   * Crée une visite via RPC (méthode manquante de CollecteService)
   */
  async createVisit(agentId: string, visitData: any): Promise<any> {
    try {
      console.log(`📝 [VisitsService] Création de la visite via RPC pour l'agent: ${agentId}`);
      
      const { data, error } = await this.supabase
        .rpc('create_visit', {
          p_agent_id: agentId,
          p_visit_data: visitData
        });

      if (error) {
        console.error("❌ [VisitsService] Erreur lors de la création de la visite:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la création de la visite');
      }
      
      console.log('✅ [VisitsService] Visite créée via RPC');
      return data.data;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur générale dans createVisit:', error);
      throw error;
    }
  }

  /**
   * Récupère une visite avec producteur et parcelle pour modification via RPC (méthode manquante de CollecteService)
   */
  async getVisitForEdit(visitId: string): Promise<any | null> {
    try {
      console.log('🔍 [VisitsService] Récupération de la visite pour modification:', visitId);

      const { data, error } = await this.supabase
        .rpc('get_visit_for_edit', { p_visit_id: visitId });

      if (error) {
        console.error('❌ [VisitsService] Erreur lors de la récupération de la visite pour modification:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Détails:', error.details);
        return null;
      }

      if (!data) {
        console.log('⚠️ [VisitsService] Visite non trouvée ou accès refusé');
        return null;
      }

      console.log('✅ [VisitsService] Visite récupérée avec succès pour modification');
      console.log('   Producer:', data.producer?.first_name, data.producer?.last_name);
      console.log('   Plot:', data.plot?.name);
      console.log('   Agent:', data.agent?.display_name || 'Agent inconnu');
      
      return data;
    } catch (error) {
      console.error('❌ [VisitsService] Erreur générale dans getVisitForEdit:', error);
      return null;
    }
  }
}

export const VisitsServiceInstance = new VisitsService();
