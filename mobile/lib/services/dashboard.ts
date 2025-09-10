import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Database } from '../../../types/database';

export interface DashboardStats {
  producersCount: number;
  activePlotsCount: number;
  completedFilesPercent: number;
}

export interface TodayVisit {
  id: string;
  producer: string;
  location?: string;
  status: 'à faire' | 'en cours' | 'terminé';
  hasGps: boolean;
  plotId?: string;
  scheduledTime?: string;
}

export interface TerrainAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium';
  plotId?: string;
  producerName?: string;
  createdAt: string;
}

export class DashboardService {
  static supabase: SupabaseClient<Database> = supabase;
  /**
   * Récupère les statistiques générales du dashboard en utilisant une fonction RPC
   */
  static async getDashboardStats(agentId: string): Promise<DashboardStats> {
    try {
      console.log('📊 Appel de la fonction RPC get_agent_dashboard_stats pour l\'agent:', agentId);

      const { data, error } = await DashboardService.supabase.rpc('get_agent_dashboard_stats', {
        p_agent_id: agentId,
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel RPC get_agent_dashboard_stats:', error);
        throw error;
      }

      console.log('✅ Statistiques RPC récupérées:', data);

      // Les données retournées par RPC sont directement au bon format
      return data as DashboardStats;

    } catch (error) {
      console.error('❌ Erreur générale dans getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Récupère les visites du jour pour l'agent en utilisant une fonction RPC
   */
  static async getTodayVisits(agentId: string): Promise<TodayVisit[]> {
    try {
      console.log('📊 Appel de la fonction RPC get_agent_today_visits pour l\'agent:', agentId);

      const { data, error } = await DashboardService.supabase.rpc('get_agent_today_visits', {
        p_agent_id: agentId,
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel RPC get_agent_today_visits:', error);
        throw error;
      }
      
      console.log('✅ Visites du jour RPC récupérées:', data);
      return (data || []) as TodayVisit[];
      
    } catch (error) {
      console.error('❌ Erreur générale dans getTodayVisits:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes terrain pour l'agent en utilisant une fonction RPC
   */
  static async getTerrainAlerts(agentId: string): Promise<TerrainAlert[]> {
    try {
      console.log('📊 Appel de la fonction RPC get_agent_terrain_alerts pour l\'agent:', agentId);

      const { data, error } = await DashboardService.supabase.rpc('get_agent_terrain_alerts', {
        p_agent_id: agentId,
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel RPC get_agent_terrain_alerts:', error);
        throw error;
      }
      
      console.log('✅ Alertes terrain RPC récupérées:', data);
      return (data || []) as TerrainAlert[];
      
    } catch (error) {
      console.error('❌ Erreur générale dans getTerrainAlerts:', error);
      throw error;
    }
  }
}
