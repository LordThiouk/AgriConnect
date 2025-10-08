/**
 * Service de gestion des parcelles - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { Database } from '../../../../../types/database';
import { AgriConnectApiClientInstance } from '../../core/api';
import { PlotsCache } from './plots.cache';
import { 
  PlotDisplay, 
  PlotFilters, 
  PlotSort, 
  PlotCreateData, 
  PlotUpdateData, 
  PlotServiceOptions 
} from './plots.types';

class PlotsService {
  private supabase: SupabaseClient<Database> = supabase;
  private cache = new PlotsCache();

  /**
   * Récupère toutes les parcelles d'un agent avec cache intelligent
   */
  async getAgentPlots(
    agentId: string, 
    filters?: PlotFilters, 
    sort?: PlotSort,
    options: PlotServiceOptions = {}
  ): Promise<PlotDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🌾 [PlotsService] Récupération des parcelles pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedPlots = await this.cache.getAgentPlots(agentId);
      if (cachedPlots) {
        console.log(`⚡ [PlotsService] Cache HIT: ${cachedPlots.length} parcelles pour l'agent ${agentId}`);
        return this.applyFiltersAndSort(cachedPlots, filters, sort);
      }
      console.log(`❌ [PlotsService] Cache MISS pour l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser le client API centralisé avec cache
      const response = await AgriConnectApiClientInstance.rpc({
        function: 'get_agent_plots_with_geolocation',
        method: 'POST',
        args: { p_agent_user_id: agentId }
      });

      const supabaseResponse = response.data as { data?: any[]; error?: any };
      
      if (supabaseResponse.error) {
        console.error('❌ [PlotsService] Erreur RPC get_agent_plots_with_geolocation:', supabaseResponse.error);
        throw new Error(supabaseResponse.error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [PlotsService] ${supabaseResponse.data?.length || 0} parcelles récupérées en ${responseTime}ms`);

      const plots = supabaseResponse.data || [];

      // Mettre en cache si activé
      if (useCache && plots.length > 0) {
        await this.cache.setAgentPlots(agentId, plots, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return this.applyFiltersAndSort(plots, filters, sort);
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la récupération des parcelles:', error);
      throw error;
    }
  }

  /**
   * Récupère une parcelle spécifique avec cache
   */
  async getPlotById(
    plotId: string, 
    agentId?: string,
    options: PlotServiceOptions = {}
  ): Promise<PlotDisplay | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🌾 [PlotsService] Récupération de la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedPlot = await this.cache.getPlot(plotId);
      if (cachedPlot) {
        console.log(`⚡ [PlotsService] Cache HIT pour la parcelle ${plotId}`);
        return cachedPlot;
      }
      console.log(`❌ [PlotsService] Cache MISS pour la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      const response = await AgriConnectApiClientInstance.rpc({
        function: 'get_plot_by_id',
        method: 'POST',
        args: { p_plot_id: plotId }
      });

      const supabaseResponse = response.data as { data?: any; error?: any };
      
      if (supabaseResponse.error) {
        console.error('❌ [PlotsService] Erreur RPC get_plot_by_id:', supabaseResponse.error);
        throw new Error(supabaseResponse.error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [PlotsService] Parcelle récupérée en ${responseTime}ms`);

      // La RPC retourne un tableau, on prend le premier élément
      const plotData = supabaseResponse.data;
      const plot = Array.isArray(plotData) && plotData.length > 0 ? plotData[0] : plotData;

      if (!plot) {
        console.warn('⚠️ [PlotsService] Aucune parcelle trouvée via RPC');
        return null;
      }

      // Extraire les coordonnées du center_point JSON
      let lat: number | undefined;
      let lon: number | undefined;
      
      if (plot.center_point && plot.center_point.coordinates) {
        lon = plot.center_point.coordinates[0]; // longitude en premier
        lat = plot.center_point.coordinates[1]; // latitude en second
      }

      // Mapping explicite vers PlotDisplay (comme CollecteService)
      const plotDisplay: PlotDisplay = {
        // Champs de base de la table plots
        id: plot.id,
        area_hectares: plot.area_hectares,
        center_point: plot.center_point,
        cooperative_id: plot.cooperative_id,
        cotton_variety: plot.cotton_variety,
        created_at: plot.created_at,
        elevation_meters: plot.elevation_meters,
        farm_file_id: plot.farm_file_id,
        geom: plot.geom,
        irrigation_type: plot.irrigation_type,
        name_season_snapshot: plot.name_season_snapshot,
        notes: plot.notes,
        producer_id: plot.producer_id,
        producer_size: plot.producer_size,
        slope_percent: plot.slope_percent,
        soil_ph: plot.soil_ph,
        soil_type: plot.soil_type,
        status: plot.status,
        typology: plot.typology,
        updated_at: plot.updated_at,
        water_source: plot.water_source,
        // Champs ajoutés par la RPC
        producer_name: plot.producer_name,
        cooperative_name: plot.cooperative_name,
        // Alias pour compatibilité
        name: plot.name_season_snapshot || 'Parcelle sans nom',
        area: plot.area_hectares || 0,
        producerName: plot.producer_name || '—',
        variety: plot.cotton_variety || '',
        soilType: plot.soil_type || '',
        waterSource: plot.water_source || '',
        hasGps: plot.has_gps || false,
        lat,
        lon,
        location: plot.location || 'Localisation non renseignée',
        lastSync: plot.updated_at || undefined,
        cropsCount: 0, // À remplir via getCropsByPlotId
        lastOperation: undefined, // À remplir via getOperationsByPlotId
        createdBy: undefined // Non disponible dans le RPC
      };

      console.log('🌾 [PlotsService] Parcelle mappée:', {
        id: plotDisplay.id,
        name: plotDisplay.name,
        area: plotDisplay.area,
        status: plotDisplay.status,
        producer_name: plotDisplay.producer_name,
        name_season_snapshot: plotDisplay.name_season_snapshot
      });

      // Mettre en cache si activé
      if (useCache && plotDisplay) {
        await this.cache.setPlot(plotId, plotDisplay, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return plotDisplay;
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la récupération de la parcelle:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles d'une fiche d'exploitation avec cache
   */
  async getFarmFilePlots(
    farmFileId: string,
    options: PlotServiceOptions = {}
  ): Promise<PlotDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🌾 [PlotsService] Récupération des parcelles de la fiche:', farmFileId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedPlots = await this.cache.getFarmFilePlots(farmFileId);
      if (cachedPlots) {
        console.log(`⚡ [PlotsService] Cache HIT: ${cachedPlots.length} parcelles pour la fiche ${farmFileId}`);
        return cachedPlots;
      }
      console.log(`❌ [PlotsService] Cache MISS pour la fiche ${farmFileId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('plots')
        .select(`
          *,
          producers!plots_producer_id_fkey (
            id,
            name,
            phone,
            village,
            department,
            region
          ),
          cooperatives!plots_cooperative_id_fkey (
            id,
            name
          ),
          farm_files!plots_farm_file_id_fkey (
            id,
            name
          )
        `)
        .eq('farm_file_id', farmFileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [PlotsService] Erreur lors de la récupération des parcelles de la fiche:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [PlotsService] ${data?.length || 0} parcelles de fiche récupérées en ${responseTime}ms`);

      const plots = this.formatPlotsData(data || []);

      // Mettre en cache si activé
      if (useCache && plots.length > 0) {
        await this.cache.setFarmFilePlots(farmFileId, plots, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return plots;
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la récupération des parcelles de la fiche:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle parcelle et invalide le cache
   */
  async createPlot(
    plotData: PlotCreateData,
    options: PlotServiceOptions = {}
  ): Promise<PlotDisplay> {
    console.log('🌾 [PlotsService] Création d\'une nouvelle parcelle:', plotData.name);

    try {
      const { data, error } = await this.supabase
        .from('plots')
        .insert({
          area_hectares: plotData.area,
          name_season_snapshot: plotData.name,
          soil_type: plotData.soil_type,
          water_source: plotData.water_source,
          status: plotData.status,
          producer_id: plotData.producer_id,
          geom: plotData.geom,
          center_point: plotData.center_point,
          farm_file_id: plotData.farm_file_id
        })
        .select(`
          *,
          producers!plots_producer_id_fkey (
            id,
            name,
            phone,
            village,
            department,
            region
          ),
          cooperatives!plots_cooperative_id_fkey (
            id,
            name
          ),
          farm_files!plots_farm_file_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [PlotsService] Erreur lors de la création de la parcelle:', error);
        throw error;
      }

      const plot = this.formatPlotData(data);

      // Invalider le cache
      await this.cache.invalidateProducerPlots(plotData.producer_id);
      if (plotData.farm_file_id) {
        await this.cache.invalidateFarmFilePlots(plotData.farm_file_id);
      }

      console.log(`✅ [PlotsService] Parcelle créée avec succès: ${plot.name}`);
      return plot;
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la création de la parcelle:', error);
      throw error;
    }
  }

  /**
   * Met à jour une parcelle et invalide le cache
   */
  async updatePlot(
    plotId: string,
    updateData: PlotUpdateData,
    options: PlotServiceOptions = {}
  ): Promise<PlotDisplay> {
    console.log('🌾 [PlotsService] Mise à jour de la parcelle:', plotId);

    try {
      const { data, error } = await this.supabase
        .from('plots')
        .update(updateData)
        .eq('id', plotId)
        .select(`
          *,
          producers!plots_producer_id_fkey (
            id,
            name,
            phone,
            village,
            department,
            region
          ),
          cooperatives!plots_cooperative_id_fkey (
            id,
            name
          ),
          farm_files!plots_farm_file_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [PlotsService] Erreur lors de la mise à jour de la parcelle:', error);
        throw error;
      }

      const plot = this.formatPlotData(data);

      // Invalider le cache
      await this.cache.invalidatePlot(plotId);

      console.log(`✅ [PlotsService] Parcelle mise à jour avec succès: ${plot.name}`);
      return plot;
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la mise à jour de la parcelle:', error);
      throw error;
    }
  }

  /**
   * Supprime une parcelle et invalide le cache
   */
  async deletePlot(
    plotId: string,
    options: PlotServiceOptions = {}
  ): Promise<void> {
    console.log('🌾 [PlotsService] Suppression de la parcelle:', plotId);

    try {
      const { error } = await this.supabase
        .from('plots')
        .delete()
        .eq('id', plotId);

      if (error) {
        console.error('❌ [PlotsService] Erreur lors de la suppression de la parcelle:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidatePlot(plotId);

      console.log(`✅ [PlotsService] Parcelle supprimée avec succès: ${plotId}`);
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la suppression de la parcelle:', error);
      throw error;
    }
  }

  /**
   * Applique les filtres et le tri aux parcelles
   */
  private applyFiltersAndSort(
    plots: PlotDisplay[], 
    filters?: PlotFilters, 
    sort?: PlotSort
  ): PlotDisplay[] {
    let filteredPlots = [...plots];

    // Appliquer les filtres
    if (filters) {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        filteredPlots = filteredPlots.filter(plot => 
          plot.name_season_snapshot.toLowerCase().includes(query) ||
          plot.producer_name.toLowerCase().includes(query) ||
          plot.village?.toLowerCase().includes(query)
        );
      }

      if (filters.village) {
        filteredPlots = filteredPlots.filter(plot => plot.village === filters.village);
      }

      if (filters.status) {
        filteredPlots = filteredPlots.filter(plot => plot.status === filters.status);
      }

      if (filters.cooperative_id) {
        filteredPlots = filteredPlots.filter(plot => plot.cooperative_id === filters.cooperative_id);
      }

      if (filters.producer_id) {
        filteredPlots = filteredPlots.filter(plot => plot.producer_id === filters.producer_id);
      }
    }

    // Appliquer le tri
    if (sort) {
      filteredPlots.sort((a, b) => {
        let aValue, bValue;
        
        // Mapper les champs de tri
        switch (sort.field) {
          case 'name':
            aValue = a.name_season_snapshot;
            bValue = b.name_season_snapshot;
            break;
          case 'area':
            aValue = a.area_hectares;
            bValue = b.area_hectares;
            break;
          case 'created_at':
            aValue = a.created_at;
            bValue = b.created_at;
            break;
          case 'updated_at':
            aValue = a.updated_at;
            bValue = b.updated_at;
            break;
          default:
            aValue = a[sort.field as keyof PlotDisplay];
            bValue = b[sort.field as keyof PlotDisplay];
        }
        
        if (sort.direction === 'asc') {
          return (aValue || '') > (bValue || '') ? 1 : -1;
        } else {
          return (aValue || '') < (bValue || '') ? 1 : -1;
        }
      });
    }

    return filteredPlots;
  }

  /**
   * Formate les données d'une parcelle
   */
  private formatPlotData(data: any): PlotDisplay {
    return {
      ...data, // Toutes les propriétés de la table
      producer_name: data.producers?.name || 'Inconnu',
      producer_phone: data.producers?.phone,
      village: data.producers?.village,
      department: data.producers?.department,
      region: data.producers?.region,
      cooperative_name: data.cooperatives?.name,
      farm_file_name: data.farm_files?.name,
      // Alias pour compatibilité
      name: data.name_season_snapshot || 'Parcelle sans nom'
    };
  }

  /**
   * Formate les données de plusieurs parcelles
   */
  private formatPlotsData(data: any[]): PlotDisplay[] {
    return data.map(plot => this.formatPlotData(plot));
  }

  /**
   * Invalide le cache des parcelles d'un agent
   */
  async invalidateAgentCache(agentId: string): Promise<void> {
    await this.cache.invalidateAgentPlots(agentId);
  }

  /**
   * Invalide le cache d'une parcelle spécifique
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    await this.cache.invalidatePlot(plotId);
  }

  /**
   * Invalide tout le cache des parcelles
   */
  async invalidateAllCache(): Promise<void> {
    await this.cache.invalidateAll();
  }

  /**
   * Récupère les parcelles d'un producteur avec cache
   */
  async getPlotsByProducerId(producerId: string): Promise<any[]> {
    console.log('🌾 [PlotsService] Récupération des parcelles du producteur:', producerId);

    try {
      const { data, error } = await this.supabase
        .rpc('get_plots_by_producer', {
          p_producer_id: producerId
        });

      if (error) {
        console.error('❌ [PlotsService] Erreur RPC get_plots_by_producer:', error);
        throw error;
      }

      console.log('✅ [PlotsService] Parcelles récupérées:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [PlotsService] Erreur lors de la récupération des parcelles:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des parcelles pour un agent
   * Utilise directement le calcul côté client car la RPC n'existe pas
   */
  async getPlotStats(agentId: string): Promise<any> {
    console.log('📊 [PlotsService] Récupération des stats des parcelles pour l\'agent:', agentId);

    try {
      // Calculer directement les stats à partir des parcelles
      console.log('ℹ️ [PlotsService] Calcul des stats depuis getAgentPlots');
      const plots = await this.getAgentPlots(agentId);
      const total_plots = plots.length;
      const active_plots = plots.filter((p: any) => (p.status || '').toLowerCase() === 'active').length;
      const inactive_plots = total_plots - active_plots;
      
      const stats = {
        total_plots,
        active_plots,
        inactive_plots,
        total_area_hectares: plots.reduce((sum: number, p: any) => sum + (p.area_hectares || 0), 0)
      };
      
      console.log('✅ [PlotsService] Stats calculées:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ [PlotsService] Erreur lors du calcul des stats des parcelles:', error);
      throw error;
    }
  }
}

export const PlotsServiceInstance = new PlotsService();
