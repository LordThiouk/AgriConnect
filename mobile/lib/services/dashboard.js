import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Database } from '../../types/database';

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
      console.log('📊 Appel de la fonction RPC get_agent_dashboard_stats pour l'agent:', agentId);

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
      console.error('❌ Erreur générale dans getDashboardStats, retour de valeurs par défaut:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        producersCount: 0,
        activePlotsCount: 0,
        completedFilesPercent: 0,
      };
    }
  }

  /**
   * Récupère les visites du jour pour l'agent
   */
  static async getTodayVisits(agentId: string): Promise<TodayVisit[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer les producteurs assignés à l'agent
      const { data: assignments, error: assignmentsError } = await supabase
        .from('agent_producer_assignments')
        .select(`
          producer_id,
          producers!inner(
            id,
            name,
            location,
            plots(
              id,
              status,
              geom
            )
          )
        `)
        .eq('agent_id', agentId);

      if (assignmentsError) throw assignmentsError;

      const visits: TodayVisit[] = [];

      for (const assignment of assignments || []) {
        const producer = assignment.producers;
        if (!producer) continue;

        // Pour chaque parcelle active du producteur
        for (const plot of producer.plots || []) {
          if (plot.status === 'cultivated') {
            // Vérifier s'il y a des opérations récentes pour déterminer le statut
            const { data: recentOps } = await supabase
              .from('operations')
              .select('id, op_date')
              .eq('plot_id', plot.id)
              .gte('op_date', today)
              .order('op_date', { ascending: false })
              .limit(1);

            let status: 'à faire' | 'en cours' | 'terminé' = 'à faire';
            if (recentOps && recentOps.length > 0) {
              const opDate = new Date(recentOps[0].op_date);
              const now = new Date();
              const diffHours = (now.getTime() - opDate.getTime()) / (1000 * 60 * 60);
              
              if (diffHours < 2) {
                status = 'en cours';
              } else if (diffHours < 24) {
                status = 'terminé';
              }
            }

            visits.push({
              id: `visit_${plot.id}`,
              producer: producer.name || 'Producteur',
              location: producer.location || 'Localisation',
              status,
              hasGps: !!plot.geom,
              plotId: plot.id
            });
          }
        }
      }

      return visits;
    } catch (error) {
      console.error('Erreur lors de la récupération des visites:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes terrain pour l'agent
   */
  static async getTerrainAlerts(agentId: string): Promise<TerrainAlert[]> {
    try {
      // Récupérer les producteurs assignés à l'agent
      const { data: assignments, error: assignmentsError } = await supabase
        .from('agent_producer_assignments')
        .select(`
          producer_id,
          producers!inner(
            id,
            name,
            plots(
              id,
              observations(
                id,
                pest_disease,
                severity,
                obs_date,
                notes
              )
            )
          )
        `)
        .eq('agent_id', agentId);

      if (assignmentsError) throw assignmentsError;

      const alerts: TerrainAlert[] = [];

      for (const assignment of assignments || []) {
        const producer = assignment.producers;
        if (!producer) continue;

        for (const plot of producer.plots || []) {
          for (const observation of plot.observations || []) {
            if (observation.pest_disease && observation.severity >= 3) {
              alerts.push({
                id: `alert_${observation.id}`,
                title: 'Maladie détectée',
                description: `${producer.name} - ${observation.pest_disease}`,
                severity: observation.severity >= 4 ? 'high' : 'medium',
                plotId: plot.id,
                producerName: producer.name,
                createdAt: observation.obs_date
              });
            }
          }
        }
      }

      // Trier par date de création (plus récent en premier)
      return alerts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }
}
