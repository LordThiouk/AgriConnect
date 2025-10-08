/**
 * Service de gestion des observations - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { Database } from '../../../../../types/database';
import { ObservationsCache } from './observations.cache';
import { 
  Observation, 
  ObservationDisplay, 
  GlobalObservationDisplay,
  ObservationFilters, 
  ObservationSort, 
  ObservationServiceOptions,
  ObservationStats
} from './observations.types';

class ObservationsService {
  private supabase: SupabaseClient<Database> = supabase;
  private cache = new ObservationsCache();

  /**
   * Récupère les observations d'une parcelle
   */
  async getObservationsByPlotId(
    plotId: string,
    options: ObservationServiceOptions = {}
  ): Promise<ObservationDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [ObservationsService] Récupération des observations pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedObservations = await this.cache.getPlotObservations(plotId);
      if (cachedObservations) {
        console.log(`⚡ [ObservationsService] Cache HIT: ${cachedObservations.length} observations pour la parcelle ${plotId}`);
        return cachedObservations;
      }
      console.log(`❌ [ObservationsService] Cache MISS pour la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();

      const { data, error } = await (this.supabase as any)
        .rpc('get_observations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ [ObservationsService] Erreur RPC get_observations_for_plot:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [ObservationsService] Observations récupérées en ${responseTime}ms:`, data?.length || 0);

      if (!data) return [];

      const observations: ObservationDisplay[] = data.map((obs: any) => ({
        id: obs.id,
        title: `Observation du ${new Date(obs.observation_date).toLocaleDateString('fr-FR')}`,
        date: new Date(obs.observation_date).toLocaleDateString('fr-FR'),
        author: obs.author_name,
        type: obs.observation_type,
        severity: (obs.severity || 1) as 1 | 2 | 3 | 4 | 5,
        description: obs.description,
      }));

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setPlotObservations(plotId, observations, cacheTTL);
      }

      return observations;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans getObservationsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Récupère les 3 dernières observations d'une parcelle
   */
  async getLatestObservations(
    plotId: string,
    options: ObservationServiceOptions = {}
  ): Promise<ObservationDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [ObservationsService] Récupération des dernières observations pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedObservations = await this.cache.getLatestPlotObservations(plotId);
      if (cachedObservations) {
        console.log(`⚡ [ObservationsService] Cache HIT: ${cachedObservations.length} dernières observations pour la parcelle ${plotId}`);
        return cachedObservations;
      }
      console.log(`❌ [ObservationsService] Cache MISS pour les dernières observations de la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();

      const { data, error } = await (this.supabase as any)
        .rpc('get_observations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ [ObservationsService] Erreur RPC get_observations_for_plot (latest):', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [ObservationsService] Dernières observations récupérées en ${responseTime}ms:`, data?.length || 0);

      if (!data) return [];

      // Prendre les 3 dernières
      const latestObservations = data.slice(0, 3).map((obs: any) => ({
        id: obs.id,
        title: obs.observation_type ?? 'Observation',
        date: new Date(obs.observation_date).toLocaleDateString('fr-FR'),
        author: obs.author_name || '',
        type: obs.observation_type,
        severity: (obs.severity || 1) as 1 | 2 | 3 | 4 | 5,
        description: obs.description || '',
      }));

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setLatestPlotObservations(plotId, latestObservations, cacheTTL);
      }

      return latestObservations;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans getLatestObservations:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les observations des producteurs assignés à l'agent
   */
  async getObservationsForAgent(
    agentId: string,
    limit: number = 50,
    offset: number = 0,
    observationTypeFilter?: string,
    severityFilter?: number,
    options: ObservationServiceOptions = {}
  ): Promise<GlobalObservationDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [ObservationsService] Récupération des observations pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedObservations = await this.cache.getAgentObservations(agentId);
      if (cachedObservations) {
        console.log(`⚡ [ObservationsService] Cache HIT: ${cachedObservations.length} observations pour l'agent ${agentId}`);
        return cachedObservations;
      }
      console.log(`❌ [ObservationsService] Cache MISS pour l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();

      const { data, error } = await (this.supabase as any).rpc('get_observations_for_agent', {
        p_agent_id: agentId,
        p_limit_count: limit,
        p_offset_count: offset,
        p_observation_type_filter: observationTypeFilter || null,
        p_severity_filter: severityFilter || null
      });

      if (error) {
        console.error("❌ [ObservationsService] Erreur lors de la récupération des observations:", error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [ObservationsService] Observations agent récupérées en ${responseTime}ms:`, data?.length || 0);

      if (!data) {
        console.log('📋 [ObservationsService] Aucune observation trouvée pour l\'agent');
        return [];
      }

      // Transformer les données en format d'affichage
      const observations: GlobalObservationDisplay[] = data.map((obs: any) => {
        const type = this.mapObservationType(obs.observation_type);
        const { color, icon } = this.getObservationStyle(type, obs.severity);
        
        return {
          id: obs.id,
          title: this.getObservationTitle(obs.observation_type, obs.pest_disease_name),
          type,
          plotId: obs.plot_id,
          plotName: obs.plot_name,
          cropType: obs.crop_type || 'N/A',
          description: obs.description || obs.recommendations || 'Aucune description',
          severity: obs.severity || 1,
          status: obs.status || 'new',
          timestamp: obs.observation_date,
          isCritical: obs.is_critical,
          color,
          icon,
          pestDiseaseName: obs.pest_disease_name,
          emergencePercent: obs.emergence_percent,
          affectedAreaPercent: obs.affected_area_percent,
          recommendations: obs.recommendations,
          producerName: obs.producer_name,
          observedBy: obs.observed_by
        };
      });

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setAgentObservations(agentId, observations, cacheTTL);
      }

      return observations;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans getObservationsForAgent:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle observation
   */
  async createObservation(observationData: any): Promise<Observation | null> {
    try {
      console.log('➕ [ObservationsService] Création d\'une nouvelle observation:', observationData);
      
      const { data, error } = await this.supabase
        .from('observations')
        .insert(observationData)
        .select()
        .single();

      if (error) {
        console.error('❌ [ObservationsService] Erreur lors de la création de l\'observation:', error);
        throw error;
      }
      
      // Invalider le cache
      if (observationData.plot_id) {
        await this.cache.invalidatePlotObservations(observationData.plot_id);
      }
      
      console.log('✅ [ObservationsService] Observation créée avec succès:', data);
      return data;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans createObservation:', error);
      throw error;
    }
  }

  /**
   * Met à jour une observation
   */
  async updateObservation(
    observationId: string,
    updateData: any
  ): Promise<Observation> {
    try {
      console.log(`🔄 [ObservationsService] Mise à jour de l'observation ${observationId}:`, updateData);
      
      const { data, error } = await this.supabase
        .from('observations')
        .update(updateData)
        .eq('id', observationId)
        .select()
        .single();

      if (error) {
        console.error("❌ [ObservationsService] Erreur lors de la mise à jour de l'observation:", error);
        throw error;
      }
      
      if (!data) throw new Error('Aucune donnée retournée après la mise à jour.');

      // Invalider le cache
      if (data.plot_id) {
        await this.cache.invalidatePlotObservations(data.plot_id);
      }

      console.log('✅ [ObservationsService] Observation mise à jour:', data);
      return data;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans updateObservation:', error);
      throw error;
    }
  }

  /**
   * Supprime une observation
   */
  async deleteObservation(observationId: string): Promise<void> {
    try {
      console.log(`🗑️ [ObservationsService] Suppression de l'observation: ${observationId}`);
      
      // Récupérer l'observation avant suppression pour invalider le cache
      const { data: observation } = await this.supabase
        .from('observations')
        .select('plot_id')
        .eq('id', observationId)
        .single();

      const { error } = await this.supabase
        .from('observations')
        .delete()
        .eq('id', observationId);

      if (error) {
        console.error("❌ [ObservationsService] Erreur lors de la suppression de l'observation:", error);
        throw error;
      }

      // Invalider le cache
      if (observation?.plot_id) {
        await this.cache.invalidatePlotObservations(observation.plot_id);
      }

      console.log('✅ [ObservationsService] Observation supprimée');

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans deleteObservation:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des observations d'un agent
   */
  async getAgentObservationStats(
    agentId: string,
    options: ObservationServiceOptions = {}
  ): Promise<ObservationStats> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📊 [ObservationsService] Récupération des statistiques pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedStats = await this.cache.getAgentObservationStats(agentId);
      if (cachedStats) {
        console.log(`⚡ [ObservationsService] Cache HIT pour les stats de l'agent ${agentId}`);
        return cachedStats;
      }
      console.log(`❌ [ObservationsService] Cache MISS pour les stats de l'agent ${agentId}`);
    }

    try {
      // Récupérer les observations pour calculer les stats
      const observations = await this.getObservationsForAgent(agentId, 1000, 0, undefined, undefined, { useCache: false });

      const stats: ObservationStats = {
        total: observations.length,
        by_type: observations.reduce((acc, obs) => {
          acc[obs.type] = (acc[obs.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_severity: observations.reduce((acc, obs) => {
          acc[obs.severity] = (acc[obs.severity] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        critical_count: observations.filter(obs => obs.severity >= 4).length,
        recent_count: observations.filter(obs => {
          const obsDate = new Date(obs.timestamp);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return obsDate > weekAgo;
        }).length
      };

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setAgentObservationStats(agentId, stats, cacheTTL);
      }

      console.log('✅ [ObservationsService] Statistiques calculées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ [ObservationsService] Erreur générale dans getAgentObservationStats:', error);
      throw error;
    }
  }

  /**
   * Mappe le type d'observation de la base vers le type d'affichage
   */
  private mapObservationType(observationType: string): 'fertilization' | 'disease' | 'irrigation' | 'harvest' | 'other' {
    switch (observationType.toLowerCase()) {
      case 'ravageur':
      case 'maladie':
        return 'disease';
      case 'levée':
      case 'développement':
        return 'fertilization';
      case 'stress_hydrique':
        return 'irrigation';
      case 'stress_nutritionnel':
        return 'fertilization';
      default:
        return 'other';
    }
  }

  /**
   * Génère le titre de l'observation basé sur le type et les détails
   */
  private getObservationTitle(observationType: string, pestDiseaseName?: string): string {
    switch (observationType.toLowerCase()) {
      case 'ravageur':
        return pestDiseaseName ? `Alerte ${pestDiseaseName}` : 'Alerte ravageur';
      case 'maladie':
        return pestDiseaseName ? `Alerte ${pestDiseaseName}` : 'Alerte maladie';
      case 'levée':
        return 'Problème de levée';
      case 'développement':
        return 'Suivi développement';
      case 'stress_hydrique':
        return 'Stress hydrique';
      case 'stress_nutritionnel':
        return 'Stress nutritionnel';
      default:
        return 'Observation terrain';
    }
  }

  /**
   * Détermine le style (couleur et icône) basé sur le type et la sévérité
   */
  private getObservationStyle(type: string, severity: number): { color: string; icon: string } {
    if (severity >= 4) {
      return { color: '#ef4444', icon: 'alert-triangle' }; // Rouge pour critique
    }

    switch (type) {
      case 'fertilization':
        return { color: '#3b82f6', icon: 'trending-up' }; // Bleu pour fertilisation
      case 'disease':
        return { color: '#ef4444', icon: 'alert-triangle' }; // Rouge pour maladies
      case 'irrigation':
        return { color: '#3b82f6', icon: 'droplet' }; // Bleu pour irrigation
      case 'harvest':
        return { color: '#10b981', icon: 'scissors' }; // Vert pour récolte
      default:
        return { color: '#6b7280', icon: 'info' }; // Gris pour autre
    }
  }
}

export const ObservationsServiceInstance = new ObservationsService();