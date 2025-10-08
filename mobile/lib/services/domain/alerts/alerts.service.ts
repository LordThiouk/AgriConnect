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
      // Mettre à jour l'observation associée à l'alerte
      await supabase
        .from('observations')
        .update({ 
          severity: 1, // Sévérité faible = résolu
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      // Invalider le cache des alertes
      await this.cache.invalidateAll();
      
      console.log('✅ Alerte marquée comme résolue:', alertId);
    } catch (error) {
      console.error('❌ Erreur lors de la résolution de l\'alerte:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes depuis l'API
   */
  private async fetchAlertsForAgent(agentId: string, filters?: AlertFilters): Promise<Alert[]> {
    try {
      // Utiliser la fonction RPC existante avec le bon paramètre
      const { data, error } = await supabase
        .rpc('get_agent_terrain_alerts', {
          p_user_id: agentId
        });

      if (error) {
        console.error('❌ Erreur RPC get_agent_terrain_alerts:', error);
        throw error;
      }

      console.log('✅ Alertes récupérées:', data?.length || 0);
      return data || [];
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
}

export const AlertsServiceInstance = new AlertsService();
