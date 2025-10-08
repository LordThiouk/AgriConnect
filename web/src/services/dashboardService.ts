import { createClient } from '@supabase/supabase-js';
import { AgentsService } from './agentsService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DashboardStats {
  totalProducers: number;
  totalPlots: number;
  totalCrops: number;
  totalRecommendations: number;
  activeRecommendations: number;
  totalArea: number;
  totalAgents: number;
  activeAgents: number;
  totalVisits: number;
  avgVisitsPerAgent: number;
  dataQualityRate: number;
  cooperatives: Array<{
    id: string;
    name: string;
    region: string;
    producers: number;
    plots: number;
    crops: number;
    area: number;
  }>;
  evolutionData: Array<{
    year: string;
    hectares: number;
  }>;
  cultureDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentAlerts: Array<{
    id: string;
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    type: 'warning' | 'error' | 'info' | 'success';
    timestamp: string;
    status: 'pending' | 'resolved' | 'dismissed';
  }>;
}

export interface Cooperative {
  id: string;
  name: string;
  region: string;
  department: string;
  commune: string;
  created_at: string;
  updated_at: string;
}

export interface Producer {
  id: string;
  cooperative_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

export interface Plot {
  id: string;
  producer_id: string;
  cooperative_id: string;
  name: string;
  area_hectares: number;
  soil_type: string;
  status: string;
  created_at: string;
}

export interface Crop {
  id: string;
  plot_id: string;
  crop_type: string;
  variety: string;
  sowing_date: string;
  status: string;
  expected_yield_kg?: number;
  actual_yield_kg?: number;
  created_at: string;
}

export interface Recommendation {
  id: string;
  crop_id: string;
  plot_id: string;
  producer_id: string;
  title: string;
  message: string;
  recommendation_type: string;
  priority: string;
  status: string;
  created_at: string;
}

export class DashboardService {
  // Méthode pour récupérer les données d'évolution depuis les vraies données de cultures
  private static async getEvolutionDataFromCrops(crops: Crop[], plots: Plot[]) {
    // Analyser les cultures par année de semis
    const yearlyData: { [year: string]: number } = {};
    
    crops.forEach(crop => {
      if (crop.sowing_date) {
        const year = new Date(crop.sowing_date).getFullYear().toString();
        if (!yearlyData[year]) {
          yearlyData[year] = 0;
        }
        
        // Utiliser l'aire de la culture si disponible, sinon l'aire de la parcelle
        const plot = plots.find(p => p.id === crop.plot_id);
        const area = crop.area_hectares || plot?.area_hectares || 0;
        yearlyData[year] += parseFloat(area.toString()) || 0;
      }
    });

    // Convertir en tableau et trier par année
    const evolutionData = Object.entries(yearlyData)
      .map(([year, hectares]) => ({
        year,
        hectares: Math.round(hectares * 100) / 100 // Arrondir à 2 décimales
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // Si aucune donnée historique, utiliser les données actuelles
    if (evolutionData.length === 0) {
      const currentYear = new Date().getFullYear().toString();
      const totalArea = Math.round(plots.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0));
      return [{ year: currentYear, hectares: totalArea }];
    }

    return evolutionData;
  }

  // Méthode pour récupérer la répartition des cultures depuis les vraies données
  private static async getCultureDistributionFromCrops(crops: Crop[], plots: Plot[]) {
    const typeDistribution: { [type: string]: number } = {};
    const areaDistribution: { [type: string]: number } = {};
    
    crops.forEach(crop => {
      const type = crop.crop_type;
      const plot = plots.find(p => p.id === crop.plot_id);
      const area = crop.area_hectares || plot?.area_hectares || 0;
      
      if (!typeDistribution[type]) {
        typeDistribution[type] = 0;
        areaDistribution[type] = 0;
      }
      
      typeDistribution[type] += 1;
      areaDistribution[type] += parseFloat(area.toString()) || 0;
    });

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    return Object.keys(typeDistribution).map((type, index) => ({
      name: type,
      value: Math.round(areaDistribution[type] * 100) / 100, // Arrondir à 2 décimales
      color: colors[index % colors.length]
    }));
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Récupérer toutes les données en parallèle
      const [cooperativesResult, producersResult, plotsResult, cropsResult, recommendationsResult, agentsStatsResult] = await Promise.all([
        supabase.from('cooperatives').select('*'),
        supabase.from('producers').select('*'),
        supabase.from('plots').select('*'),
        supabase.from('crops').select('*'),
        supabase.from('recommendations').select('*'),
        AgentsService.getAgentsStats()
      ]);

      // Vérifier les erreurs
      if (cooperativesResult.error) throw cooperativesResult.error;
      if (producersResult.error) throw producersResult.error;
      if (plotsResult.error) throw plotsResult.error;
      if (cropsResult.error) throw cropsResult.error;
      if (recommendationsResult.error) throw recommendationsResult.error;

      const cooperatives = cooperativesResult.data as Cooperative[];
      const producers = producersResult.data as Producer[];
      const plots = plotsResult.data as Plot[];
      const crops = cropsResult.data as Crop[];
      const recommendations = recommendationsResult.data as Recommendation[];
      const agentsStats = agentsStatsResult;

      // Calculer les statistiques par coopérative
      const cooperativesStats = cooperatives.map(coop => {
        const coopProducers = producers.filter(p => p.cooperative_id === coop.id);
        const coopPlots = plots.filter(p => p.cooperative_id === coop.id);
        const coopCrops = crops.filter(c => 
          coopPlots.some(plot => plot.id === c.plot_id)
        );
        const totalArea = coopPlots.reduce((sum, plot) => 
          sum + (plot.area_hectares || 0), 0
        );

        return {
          id: coop.id,
          name: coop.name,
          region: coop.region,
          producers: coopProducers.length,
          plots: coopPlots.length,
          crops: coopCrops.length,
          area: Math.round(totalArea)
        };
      });

      // Données d'évolution des surfaces basées sur les vraies données de cultures
      const currentYear = new Date().getFullYear();
      
      // Récupérer les données d'évolution depuis les cultures réelles
      const evolutionData = await this.getEvolutionDataFromCrops(crops, plots);

      // Répartition des cultures basée sur les vraies données
      const cultureDistribution = await this.getCultureDistributionFromCrops(crops, plots);

      // Alertes récentes depuis la base de données
      const recentAlertsFromDB = recommendations
        .filter(r => r.status === 'pending' || r.status === 'sent')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(r => {
          const priority = r.priority === 'urgent' ? 'high' : r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low';
          const type = r.priority === 'urgent' ? 'error' : r.priority === 'high' ? 'warning' : 'info';
          
          // Calculer le temps écoulé
          const now = new Date();
          const created = new Date(r.created_at);
          const diffMs = now.getTime() - created.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          
          let timestamp = '';
          if (diffDays > 0) {
            timestamp = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
          } else if (diffHours > 0) {
            timestamp = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
          } else {
            timestamp = 'À l\'instant';
          }
          
          return {
            id: r.id,
            title: r.title || 'Recommandation',
            message: r.message || 'Nouvelle recommandation disponible',
            priority: priority as 'high' | 'medium' | 'low',
            type: type as 'warning' | 'error' | 'info' | 'success',
            timestamp,
            status: r.status === 'completed' ? 'resolved' as const : 'pending' as const
          };
        });

      const recentAlerts = recentAlertsFromDB.length > 0 ? recentAlertsFromDB : [
        {
          id: 'no-alerts',
          title: 'Aucune alerte récente',
          message: 'Toutes les recommandations sont à jour',
          priority: 'low' as const,
          type: 'success' as const,
          timestamp: 'Maintenant',
          status: 'resolved' as const
        }
      ];

      // Calculer les statistiques globales
      const totalStats: DashboardStats = {
        totalProducers: producers.length,
        totalPlots: plots.length,
        totalCrops: crops.length,
        totalRecommendations: recommendations.length,
        activeRecommendations: recommendations.filter(r => 
          r.status === 'pending' || r.status === 'sent'
        ).length,
        totalArea: Math.round(plots.reduce((sum, plot) => 
          sum + (plot.area_hectares || 0), 0
        )),
        totalAgents: agentsStats.totalAgents,
        activeAgents: agentsStats.activeAgents,
        totalVisits: agentsStats.totalVisits,
        avgVisitsPerAgent: agentsStats.avgVisitsPerAgent,
        dataQualityRate: agentsStats.dataQualityRate,
        cooperatives: cooperativesStats,
        evolutionData,
        cultureDistribution,
        recentAlerts
      };

      return totalStats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  static async getCooperatives(): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Cooperative[];
  }

  static async getProducers(cooperativeId?: string): Promise<Producer[]> {
    let query = supabase
      .from('producers')
      .select('*')
      .eq('is_active', true);

    if (cooperativeId) {
      query = query.eq('cooperative_id', cooperativeId);
    }

    const { data, error } = await query.order('first_name');

    if (error) throw error;
    return data as Producer[];
  }

  static async getPlots(cooperativeId?: string): Promise<Plot[]> {
    let query = supabase
      .from('plots')
      .select('*');

    if (cooperativeId) {
      query = query.eq('cooperative_id', cooperativeId);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data as Plot[];
  }

  static async getCrops(plotId?: string): Promise<Crop[]> {
    let query = supabase
      .from('crops')
      .select('*');

    if (plotId) {
      query = query.eq('plot_id', plotId);
    }

    const { data, error } = await query.order('sowing_date', { ascending: false });

    if (error) throw error;
    return data as Crop[];
  }

  static async getRecommendations(status?: string): Promise<Recommendation[]> {
    let query = supabase
      .from('recommendations')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Recommendation[];
  }

  static async getCropTypes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('crops')
      .select('crop_type')
      .not('crop_type', 'is', null);

    if (error) throw error;
    
    // Extraire les types uniques
    const uniqueTypes = [...new Set(data.map(item => item.crop_type))];
    return uniqueTypes.sort();
  }

  static async getRecommendationTypes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('recommendations')
      .select('recommendation_type')
      .not('recommendation_type', 'is', null);

    if (error) throw error;
    
    // Extraire les types uniques
    const uniqueTypes = [...new Set(data.map(item => item.recommendation_type))];
    return uniqueTypes.sort();
  }
}
