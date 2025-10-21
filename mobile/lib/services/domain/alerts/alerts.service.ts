/**
 * AlertsService - Service pour la gestion des alertes
 * Utilise le système de cache intelligent AgriConnect
 */

import { AlertsCache } from './alerts.cache';
import { Alert, AlertFilters, AlertStats } from './alerts.types';
import { supabase } from '../../../../lib/supabase-client';

export class AlertsService {
  private cache = new AlertsCache();

  /**
   * Récupère les alertes pour un agent avec cache
   */
  async getAlertsForAgent(agentId: string, filters?: AlertFilters): Promise<Alert[]> {
    // Vérifier le cache d'abord
    const cachedAlerts = await this.cache.getAgentAlerts(agentId, filters);
    if (cachedAlerts) {
      console.log(`⚡ [AlertsService] Cache HIT: ${cachedAlerts.length} alertes pour l'agent ${agentId}`);
      return cachedAlerts;
    }

    // Récupérer depuis l'API si pas en cache
    const alerts = await this.fetchAlertsForAgent(agentId, filters);
    
    // Mettre en cache
    await this.cache.setAgentAlerts(agentId, alerts, filters);
    
    return alerts;
  }

  /**
   * Récupère les statistiques des alertes pour un agent
   */
  async getAlertStats(agentId: string): Promise<AlertStats> {
    // Vérifier le cache d'abord
    const cachedStats = await this.cache.getAgentStats(agentId);
    if (cachedStats) {
      console.log(`⚡ [AlertsService] Cache HIT: stats pour l'agent ${agentId}`);
      return cachedStats;
    }

    // Récupérer depuis l'API si pas en cache
    const stats = await this.fetchAlertStats(agentId);
    
    // Mettre en cache
    await this.cache.setAgentStats(agentId, stats);
    
    return stats;
  }

  /**
   * Marque une alerte comme résolue
   */
  async markAlertAsResolved(alertId: string): Promise<void> {
    try {
      console.log('🔧 [AlertsService] Résolution de l\'alerte:', alertId);
      
      // Mettre à jour l'observation associée à l'alerte
      const { data, error } = await supabase
        .from('observations')
        .update({ 
          severity: 1, // Sévérité faible = résolu
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select();

      if (error) {
        console.error('❌ [AlertsService] Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ [AlertsService] Observation mise à jour:', data);

            // Invalider le cache des alertes
            console.log('🔄 [AlertsService] Invalidation du cache...');
            await this.cache.invalidateAll();
            console.log('✅ [AlertsService] Cache invalidé');
      
      console.log('✅ [AlertsService] Alerte marquée comme résolue:', alertId);
    } catch (error) {
      console.error('❌ [AlertsService] Erreur lors de la résolution de l\'alerte:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes depuis l'API
   */
  private async fetchAlertsForAgent(agentId: string, filters?: AlertFilters): Promise<Alert[]> {
    try {
      console.log('🔍 [AlertsService] fetchAlertsForAgent appelé avec:', {
        agentId,
        filters,
        agentIdType: typeof agentId
      });

      // Utiliser la fonction RPC existante avec le bon paramètre
      const { data, error } = await supabase
        .rpc('get_agent_terrain_alerts', {
          p_user_id: agentId
        });

      console.log('🔍 [AlertsService] Réponse RPC get_agent_terrain_alerts:', {
        data,
        error,
        dataLength: data?.length || 0
      });

      if (error) {
        console.error('❌ Erreur RPC get_agent_terrain_alerts:', error);
        throw error;
      }

      console.log('✅ Alertes récupérées:', data?.length || 0);
      
      // Mapper les données de la RPC vers l'interface Alert
      const mappedAlerts = (data || []).map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity === 'high' ? 4 : 3, // Convertir string vers number
        alert_type: 'other' as const,
        producer_id: alert.producerId,
        producer_name: alert.producerName,
        plot_id: alert.plotId,
        plot_name: alert.plotName,
        created_at: alert.createdAt,
        updated_at: alert.createdAt,
        is_resolved: false, // Toujours false car on filtre les non-résolues
        producerId: alert.producerId,
        plotId: alert.plotId
      }));

      console.log('✅ Alertes mappées:', mappedAlerts.length);
      return mappedAlerts;
    } catch (error) {
      console.error('❌ Erreur fetchAlertsForAgent:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des alertes depuis l'API
   */
  private async fetchAlertStats(agentId: string): Promise<AlertStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_terrain_alerts', {
          p_user_id: agentId
        });

      if (error) {
        console.error('❌ Erreur RPC get_agent_terrain_alerts pour stats:', error);
        throw error;
      }

      const alerts = data || [];
      
      // Calculer les statistiques
      const stats: AlertStats = {
        total: alerts.length,
        urgent: alerts.filter((a: any) => a.severity >= 4).length,
        medium: alerts.filter((a: any) => a.severity === 3).length,
        low: alerts.filter((a: any) => a.severity <= 2).length,
        resolved: alerts.filter((a: any) => a.severity <= 1).length,
        unresolved: alerts.filter((a: any) => a.severity > 1).length
      };

      console.log('✅ Statistiques alertes calculées:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur fetchAlertStats:', error);
      throw error;
    }
  }

  /**
   * Invalide tout le cache des alertes
   * Note: Les alertes sont basées sur les observations, donc on invalide le cache des observations
   */
  async invalidateAllCache(): Promise<void> {
    try {
      console.log('🗑️ [AlertsService] Invalidation du cache des alertes (via observations)');
      
      // Invalider le cache des alertes
      await this.cache.invalidateAll();
      
      // Invalider aussi le cache des observations car les alertes en dépendent
      const { ObservationsCache } = await import('../observations/observations.cache');
      const observationsCache = new ObservationsCache();
      
      // Invalider tous les caches d'observations
      await observationsCache.invalidateAgentObservations('*');
      
      console.log('✅ Cache des alertes et observations invalidé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'invalidation du cache des alertes:', error);
      throw error;
    }
  }
}

export const AlertsServiceInstance = new AlertsService();
