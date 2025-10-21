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
    filters?: any,
    options: VisitServiceOptions = {}
  ): Promise<Visit[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📅 [VisitsService] Récupération des visites pour l\'agent:', agentId);

    // Vérifier le cache si activé (uniquement quand pas de filtre spécifique)
    // Si un filtre est appliqué (autre que 'all'), on contourne le cache interne pour respecter le filtre
    let unifiedFilter: string | undefined;
    try {
      unifiedFilter = (filters?.period || filters?.status) as string | undefined;
    } catch {
      unifiedFilter = undefined;
    }
    const isFilterSpecific = unifiedFilter && unifiedFilter !== 'all';

    if (useCache && !refreshCache && !isFilterSpecific) {
      const cachedVisits = await this.cache.getAgentVisits(agentId);
      if (cachedVisits) {
        console.log(`⚡ [VisitsService] Cache HIT: ${cachedVisits.length} visites pour l'agent ${agentId}`);
        return cachedVisits;
      }
      console.log(`❌ [VisitsService] Cache MISS pour les visites de l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // IMPORTANT: La RPC attend l'auth user_id, pas profiles.id
      const agentParam = agentId;

      // Utiliser la RPC comme dans collecte.ts
      // La RPC n'accepte qu'un seul filtre textuel p_filter (today|week|month|past|future|all|completed|pending|in_progress)
      const rpcArgs: Record<string, any> = { p_user_id: agentParam };
      // Par défaut, utiliser 'all' pour récupérer toutes les visites si aucun filtre n'est spécifié
      rpcArgs.p_filter = unifiedFilter || 'all';

      console.log(`🔍 [VisitsService] RPC args:`, rpcArgs);

      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: rpcArgs,
        method: 'POST',
        cache: useCache ? cacheTTL : false
      });

      if (error) {
        console.error('❌ [VisitsService] Erreur RPC get_agent_all_visits_with_filters:', error);
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      // Le client RPC peut retourner soit un tableau directement, soit un objet { data, error, status }
      const rawPayload = (data as any)?.data ?? data;
      const rows: any[] = Array.isArray(rawPayload) ? rawPayload : [];
      console.log(`✅ [VisitsService] ${rows.length} visites récupérées en ${responseTime}ms`);
      console.log(`🔍 [VisitsService] Raw RPC data:`, data);

      const visits = rows.map((visit: any) => this.formatVisitData(visit));
      console.log(`🔍 [VisitsService] Formatted visits:`, visits.map(v => ({
        id: v.id,
        type: v.visit_type,
        status: v.status,
        date: v.visit_date,
        producer: v.producer_name,
        plot: v.plot_name
      })));

      // Mettre en cache si activé et uniquement pour le jeu non filtré (all)
      if (useCache && visits.length > 0 && !isFilterSpecific) {
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
      
      const profileId = await this.getProfileIdFromUserId(agentId);
      const agentParam = profileId || agentId;
      // Utiliser la RPC comme dans collecte.ts avec filtre "today"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentParam,
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
      
      const profileId = await this.getProfileIdFromUserId(agentId);
      const agentParam = profileId || agentId;
      // Utiliser la RPC comme dans collecte.ts avec filtre "upcoming"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentParam,
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
      
      const profileId = await this.getProfileIdFromUserId(agentId);
      const agentParam = profileId || agentId;
      // Utiliser la RPC comme dans collecte.ts avec filtre "past"
      const { data, error } = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_all_visits_with_filters',
        args: {
          p_user_id: agentParam,
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
      if (visit.agent_id) {
        await this.cache.invalidateAgentCache(visit.agent_id);
      }
      if (visit.plot_id) {
        await this.cache.invalidatePlotCache(visit.plot_id);
      }

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
   * Map a Supabase auth user_id (agents) to profiles.id when available
   */
  private async getProfileIdFromUserId(userId: string): Promise<string | null> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      return profile?.id ?? null;
    } catch {
      return null;
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
      // Utiliser les champs retournés par la RPC get_agent_all_visits_with_filters
      plot_name: data.plot_name || 'Parcelle inconnue',
      producer_name: data.producer || 'Producteur inconnu',
      cooperative_name: data.cooperative_name || 'Coopérative inconnue',
      agent_name: data.agent_name || 'Agent inconnu',
      parcel_area: data.plot_area,
      parcel_location: data.location,
      // Coordonnées GPS si disponibles
      lat: data.lat,
      lon: data.lon,
      has_gps: data.has_gps || false,
      duration_minutes: data.duration_minutes,
      weather_conditions: data.weather_conditions
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
      console.log('🔄 [VisitsService] Appel RPC get_visit_for_edit avec visitId:', visitId);
      
      const { data, error } = await this.supabase
        .rpc('get_visit_for_edit', {
          p_visit_id: visitId
        });

      console.log('🔍 [VisitsService] Réponse RPC get_visit_for_edit:', { data, error });

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

}

export const VisitsServiceInstance = new VisitsService();
