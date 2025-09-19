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

      // Données d'évolution des surfaces (simulées pour l'instant)
      const evolutionData = [
        { year: '2020', hectares: 1200 },
        { year: '2021', hectares: 1350 },
        { year: '2022', hectares: 1420 },
        { year: '2023', hectares: 1580 },
        { year: '2024', hectares: Math.round(plots.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0)) }
      ];

      // Répartition des cultures (simulée basée sur les données réelles)
      const cultureTypes = [...new Set(crops.map(c => c.crop_type))];
      const cultureDistribution = cultureTypes.map((type, index) => {
        const typeCrops = crops.filter(c => c.crop_type === type);
        const totalArea = typeCrops.reduce((sum, crop) => {
          const plot = plots.find(p => p.id === crop.plot_id);
          return sum + (plot?.area_hectares || 0);
        }, 0);

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        
        return {
          name: type,
          value: Math.round(totalArea),
          color: colors[index % colors.length]
        };
      });

      // Alertes récentes (simulées pour l'instant)
      const recentAlerts = [
        {
          id: '1',
          title: 'Fertilisation recommandée',
          message: 'La parcelle de Maïs de M. Diop nécessite une fertilisation urgente',
          priority: 'high' as const,
          type: 'warning' as const,
          timestamp: 'Il y a 2 heures',
          status: 'pending' as const
        },
        {
          id: '2',
          title: 'Ravageur détecté',
          message: 'Présence de chenilles sur les plants de Cacao dans la région de Thiès',
          priority: 'medium' as const,
          type: 'error' as const,
          timestamp: 'Il y a 4 heures',
          status: 'pending' as const
        },
        {
          id: '3',
          title: 'Récolte terminée',
          message: 'La récolte de Riz de la parcelle P001 a été complétée avec succès',
          priority: 'low' as const,
          type: 'success' as const,
          timestamp: 'Il y a 1 jour',
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
