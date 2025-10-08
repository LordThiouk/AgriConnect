import { useState, useEffect, useRef, useCallback } from 'react';
import { VisitsService } from '../lib/services/domain/visits';
import { ObservationsService } from '../lib/services/domain/observations';
import { PlotsService } from '../lib/services/domain/plots';
import { VisitDisplay } from '../lib/services/domain/visits/visits.types';

export interface DashboardStats {
  producersCount: number;
  activePlotsCount: number;
  completedFilesPercent: number;
}

export type VisitFilter = 'today' | 'week' | 'month' | 'past' | 'future' | 'all' | 'completed' | 'pending' | 'in_progress';

export interface TerrainAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium';
  plotId?: string;
  producerName?: string;
  createdAt: string;
}

export interface UseAgentDashboardReturn {
  // Données
  stats: DashboardStats | null;
  visits: VisitDisplay[];
  alerts: TerrainAlert[];
  
  // États
  loading: boolean;
  error: string | null;
  currentFilter: VisitFilter;
  
  // Actions
  refresh: () => Promise<void>;
  setFilter: (filter: VisitFilter) => Promise<void>;
}

export function useAgentDashboard(agentId: string | null): UseAgentDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visits, setVisits] = useState<VisitDisplay[]>([]);
  const [alerts, setAlerts] = useState<TerrainAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<VisitFilter>('today');
  
  // Cache pour éviter les appels répétés
  const cacheRef = useRef<{
    data: { stats: DashboardStats; visits: VisitDisplay[]; alerts: TerrainAlert[] } | null;
    timestamp: number;
    filter: VisitFilter;
    agentId: string | null;
  }>({
    data: null,
    timestamp: 0,
    filter: 'today',
    agentId: null
  });
  
  // Debounce pour éviter les appels trop fréquents
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Utiliser l'ID de l'agent fourni ou ne pas charger si null
    if (!agentId) {
      setLoading(false);
      return;
    }
    
    const currentAgentId = agentId;
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 secondes de cache
    
    // Vérifier le cache si pas de refresh forcé
    if (!forceRefresh && 
        cacheRef.current.data && 
        cacheRef.current.agentId === currentAgentId &&
        cacheRef.current.filter === currentFilter &&
        (now - cacheRef.current.timestamp) < CACHE_DURATION) {
      console.log('🚀 Utilisation du cache pour le dashboard (évite les appels API)');
      console.log('📊 Données du cache:', {
        filter: currentFilter,
        count: cacheRef.current.data.visits?.length || 0,
        visits: cacheRef.current.data.visits?.map(v => ({
          id: v.id,
          type: v.type,
          status: v.status,
          date: v.date
        })) || []
      });
      setStats(cacheRef.current.data.stats);
      setVisits(cacheRef.current.data.visits);
      setAlerts(cacheRef.current.data.alerts);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des données du dashboard pour l\'agent:', currentAgentId, 'filtre:', currentFilter);

      // Utiliser les nouveaux services refactorisés avec cache
      console.log('📊 Récupération des stats...');
      const plots = await PlotsService.getAgentPlots(currentAgentId, undefined, undefined, { useCache: true });
      const statsData = {
        producersCount: 0, // TODO: Implémenter avec ProducersService
        activePlotsCount: plots.length,
        completedFilesPercent: 0 // TODO: Implémenter avec FarmFilesService
      };
      
      console.log('📅 Récupération des visites...');
      const visitsRaw = await VisitsService.getAgentVisits(currentAgentId, { 
        useCache: true,
        refreshCache: forceRefresh 
      });
      
      // Convertir Visit[] en VisitDisplay[]
      const visitsData = visitsRaw.map(visit => ({
        id: visit.id,
        type: visit.visit_type,
        date: new Date(visit.visit_date).toLocaleDateString('fr-FR'),
        status: visit.status,
        plot_name: visit.plot_name || 'N/A',
        producer_name: visit.producer_name || 'N/A',
        notes: visit.notes || '',
        parcel_area: visit.parcel_area,
        parcel_location: visit.parcel_location,
      }));
      
      console.log('🚨 Récupération des alertes...');
      const observationsRaw = await ObservationsService.getObservationsForAgent(currentAgentId, { 
        useCache: true 
      });
      
      // Convertir Observation[] en TerrainAlert[]
      const alertsData = observationsRaw
        .filter(obs => (obs.severity || 1) >= 4)
        .map(obs => ({
          id: obs.id,
          title: obs.observation_type || 'Observation',
          description: obs.description || '',
          severity: (obs.severity || 1) >= 5 ? 'high' as const : 'medium' as const,
          plotId: obs.plot_id,
          producerName: obs.producer_name || 'Agent',
          createdAt: new Date(obs.observation_date).toLocaleDateString('fr-FR')
        }));

      const dashboardData = {
        stats: statsData,
        visits: visitsData,
        alerts: alertsData
      };

      console.log('✅ Données du dashboard chargées (nouveaux services):', dashboardData);
      console.log('📊 Détails des visites:', {
        filter: currentFilter,
        count: dashboardData.visits?.length || 0,
        visits: dashboardData.visits?.map(v => ({
          id: v.id,
          type: v.type,
          status: v.status,
          date: v.date
        })) || []
      });
      
      // Mettre à jour le cache
      cacheRef.current = {
        data: dashboardData,
        timestamp: now,
        filter: currentFilter,
        agentId: currentAgentId
      };
      
      console.log('🔄 Mise à jour des états React...');
      setStats(dashboardData.stats);
      setVisits(dashboardData.visits);
      setAlerts(dashboardData.alerts);
      console.log('✅ États React mis à jour');
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
  }, [agentId, currentFilter]);

  const refresh = useCallback(async () => {
    await loadData(true); // Force refresh
  }, [loadData]);

  const setFilter = useCallback(async (filter: VisitFilter) => {
    // Annuler le debounce précédent si il existe
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Invalider le cache des visites lors du changement de filtre
    if (filter !== currentFilter) {
      console.log('🔄 Changement de filtre détecté, invalidation du cache...');
      // Le cache sera géré automatiquement par VisitsService
      
      // Vider immédiatement les visites pour éviter l'affichage des anciennes données
      setVisits([]);
      console.log('🧹 Visites vidées pour éviter l\'affichage des anciennes données');
    }
    
    setCurrentFilter(filter);
    
    // Debounce pour éviter les appels trop fréquents lors du changement de filtre
    debounceRef.current = setTimeout(async () => {
      await loadData(true); // Force refresh pour nouveau filtre
    }, 300); // 300ms de debounce
  }, [loadData, currentFilter]);

  useEffect(() => {
    loadData(false); // Ne pas forcer le refresh au premier chargement
  }, [agentId, currentFilter, loadData]);

  return {
    stats,
    visits,
    alerts,
    loading,
    error,
    currentFilter,
    refresh,
    setFilter
  };
}
