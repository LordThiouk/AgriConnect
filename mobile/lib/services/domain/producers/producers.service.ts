/**
 * ProducersService - Service pour la gestion des producteurs
 * Utilise le système de cache intelligent AgriConnect
 */

import { ProducersCache } from './producers.cache';
import { Producer, ProducerFilters, ProducerStats } from './producers.types';
import { supabase } from '../../../../lib/supabase-client';

export class ProducersService {
  private cache = new ProducersCache();

  /**
   * Récupère les producteurs assignés à un agent avec cache
   */
  async getProducersByAgentId(agentId: string, filters?: ProducerFilters): Promise<Producer[]> {
    // Vérifier le cache d'abord
    const cachedProducers = await this.cache.getAgentProducers(agentId, filters);
    if (cachedProducers) {
      console.log(`⚡ [ProducersService] Cache HIT: ${cachedProducers.length} producteurs pour l'agent ${agentId}`);
      return cachedProducers;
    }

    // Récupérer depuis l'API si pas en cache
    const producers = await this.fetchProducersByAgentId(agentId, filters);
    
    // Mettre en cache
    await this.cache.setAgentProducers(agentId, producers, filters);
    
    return producers;
  }

  /**
   * Récupère un producteur par ID avec cache
   */
  async getProducerById(producerId: string): Promise<Producer | null> {
    // Vérifier le cache d'abord
    const cachedProducer = await this.cache.getProducer(producerId);
    if (cachedProducer) {
      console.log(`⚡ [ProducersService] Cache HIT: producteur ${producerId}`);
      return cachedProducer;
    }

    // Récupérer depuis l'API si pas en cache
    const producer = await this.fetchProducerById(producerId);
    
    // Mettre en cache si trouvé
    if (producer) {
      await this.cache.setProducer(producerId, producer);
    }
    
    return producer;
  }

  /**
   * Récupère les statistiques des producteurs pour un agent
   */
  async getProducerStats(agentId: string): Promise<ProducerStats> {
    // Vérifier le cache d'abord
    const cachedStats = await this.cache.getAgentStats(agentId);
    if (cachedStats) {
      console.log(`⚡ [ProducersService] Cache HIT: stats pour l'agent ${agentId}`);
      return cachedStats;
    }

    // Récupérer depuis l'API si pas en cache
    const stats = await this.fetchProducerStats(agentId);
    
    // Mettre en cache
    await this.cache.setAgentStats(agentId, stats);
    
    return stats;
  }

  /**
   * Récupère les producteurs depuis l'API
   */
  private async fetchProducersByAgentId(agentId: string, filters?: ProducerFilters): Promise<Producer[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_producers_unified', {
          p_agent_id: agentId
        });

      if (error) {
        console.error('❌ Erreur RPC get_agent_producers_unified:', error);
        throw error;
      }

      console.log('✅ Producteurs récupérés:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetchProducersByAgentId:', error);
      throw error;
    }
  }

  /**
   * Récupère un producteur par ID depuis l'API
   */
  private async fetchProducerById(producerId: string): Promise<Producer | null> {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('id', producerId)
        .single();

      if (error) {
        console.error('❌ Erreur fetchProducerById:', error);
        return null;
      }

      console.log('✅ Producteur récupéré:', data?.id);
      return data;
    } catch (error) {
      console.error('❌ Erreur fetchProducerById:', error);
      return null;
    }
  }

  /**
   * Vide le cache des statistiques pour un agent
   */
  async clearStatsCache(agentId: string): Promise<void> {
    await this.cache.clearAgentStats(agentId);
    console.log(`🗑️ [ProducersService] Cache des stats vidé pour l'agent ${agentId}`);
  }

  /**
   * Récupère l'ID du profil à partir de l'ID utilisateur
   */
  private async getProfileIdFromUserId(userId: string): Promise<string | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'agent')
        .single();

      if (error) {
        console.error('❌ Erreur récupération profil:', error);
        return null;
      }

      return profile?.id || null;
    } catch (error) {
      console.error('❌ Erreur getProfileIdFromUserId:', error);
      return null;
    }
  }

  /**
   * Récupère les statistiques des producteurs depuis l'API
   */
  private async fetchProducerStats(agentId: string): Promise<ProducerStats> {
    try {
      // D'abord, récupérer l'ID du profil à partir de l'ID utilisateur
      console.log('📊 [ProducersService] Récupération de l\'ID profil pour l\'utilisateur:', agentId);
      const profileId = await this.getProfileIdFromUserId(agentId);
      
      if (!profileId) {
        console.log('❌ [ProducersService] Profil agent non trouvé pour l\'utilisateur:', agentId);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          with_plots: 0,
          without_plots: 0
        };
      }

      console.log('📊 [ProducersService] ID profil trouvé:', profileId);
      
      // Utiliser la RPC get_agent_assignments avec l'ID du profil
      const { data: assignments, error: assignmentsError } = await supabase
        .rpc('get_agent_assignments', {
          p_agent_id: profileId
        });

      if (assignmentsError) {
        console.error('❌ Erreur RPC get_agent_assignments pour stats:', assignmentsError);
        throw assignmentsError;
      }

      const assignmentsData = assignments || [];
      console.log('📊 [ProducersService] Assignations récupérées:', assignmentsData.length);
      
      // Filtrer seulement les assignations de type 'producer'
      const producerAssignments = assignmentsData.filter((a: any) => a.assigned_to_type === 'producer');
      console.log('📊 [ProducersService] Assignations producteurs:', producerAssignments.length);
      
      // Calculer les statistiques basées sur les assignations
      const stats: ProducerStats = {
        total: producerAssignments.length,
        active: producerAssignments.length, // Tous les producteurs assignés sont considérés actifs
        inactive: 0,
        with_plots: producerAssignments.length, // Tous ont des parcelles par définition
        without_plots: 0
      };

      console.log('✅ Statistiques producteurs calculées via assignations:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur fetchProducerStats:', error);
      throw error;
    }
  }
}

export const ProducersServiceInstance = new ProducersService();
