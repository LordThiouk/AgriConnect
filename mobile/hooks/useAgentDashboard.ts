import { useState, useEffect } from 'react';
import { DashboardService, DashboardStats, TodayVisit, TerrainAlert } from '../lib/services/dashboard';

export interface UseAgentDashboardReturn {
  // Données
  stats: DashboardStats | null;
  visits: TodayVisit[];
  alerts: TerrainAlert[];
  
  // États
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
}

export function useAgentDashboard(agentId: string | null): UseAgentDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visits, setVisits] = useState<TodayVisit[]>([]);
  const [alerts, setAlerts] = useState<TerrainAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    // ID de l'agent fourni par l'utilisateur
    const currentAgentId = agentId || 'd6daff9e-c1af-4a96-ab51-bd8925813890';
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des données du dashboard pour l\'agent:', currentAgentId);

      // Charger toutes les données en parallèle
      const [statsData, visitsData, alertsData] = await Promise.all([
        DashboardService.getDashboardStats(currentAgentId),
        DashboardService.getTodayVisits(currentAgentId),
        DashboardService.getTerrainAlerts(currentAgentId)
      ]);

      console.log('✅ Données du dashboard chargées:', { statsData, visitsData, alertsData });
      setStats(statsData);
      setVisits(visitsData);
      setAlerts(alertsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Une erreur inconnue est survenue';
      console.error('❌ Erreur détaillée lors du chargement des données du dashboard:', errorMessage, err);
      setError(errorMessage);
      
      // En cas d'erreur, initialiser avec des valeurs par défaut
      console.log('🔄 Initialisation avec des valeurs par défaut en cas d\'erreur');
      setStats({
        producersCount: 0,
        activePlotsCount: 0,
        completedFilesPercent: 0
      });
      setVisits([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [agentId]);

  return {
    stats,
    visits,
    alerts,
    loading,
    error,
    refresh
  };
}
