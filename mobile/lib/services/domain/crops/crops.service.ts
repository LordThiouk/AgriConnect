/**
 * Service de gestion des cultures - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { Database } from '../../../../../types/database';
import { AgriConnectApiClientInstance } from '../../core/api';
import { CropsCache } from './crops.cache';
import { 
  Crop, 
  CropFilters, 
  CropSort, 
  CropCreateData, 
  CropUpdateData, 
  CropServiceOptions 
} from './crops.types';

class CropsService {
  private supabase: SupabaseClient<Database> = supabase;
  private cache = new CropsCache();

  /**
   * Récupère toutes les cultures d'une parcelle avec cache intelligent
   */
  async getCropsByPlotId(
    plotId: string,
    agentId?: string,
    filters?: CropFilters,
    sort?: CropSort,
    options: CropServiceOptions = {}
  ): Promise<Crop[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🌾 [CropsService] Récupération des cultures pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedCrops = await this.cache.getPlotCrops(plotId);
      if (cachedCrops) {
        console.log(`⚡ [CropsService] Cache HIT: ${cachedCrops.length} cultures pour la parcelle ${plotId}`);
        return this.applyFiltersAndSort(cachedCrops, filters, sort);
      }
      console.log(`❌ [CropsService] Cache MISS pour la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser le client API centralisé avec cache
      const response = await AgriConnectApiClientInstance.rpc({
        function: 'get_crops_by_plot_id',
        method: 'POST',
        args: { p_plot_id: plotId }
      });

      const supabaseResponse = response.data as { data?: any[]; error?: any };
      
      if (supabaseResponse.error) {
        console.error('❌ [CropsService] Erreur RPC get_crops_by_plot_id:', supabaseResponse.error);
        throw new Error(supabaseResponse.error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [CropsService] ${supabaseResponse.data?.length || 0} cultures récupérées en ${responseTime}ms`);

      const crops = supabaseResponse.data || [];

      // Mettre en cache si activé
      if (useCache && crops.length > 0) {
        await this.cache.setPlotCrops(plotId, crops, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return this.applyFiltersAndSort(crops, filters, sort);
    } catch (error) {
      console.error('❌ [CropsService] Erreur lors de la récupération des cultures:', error);
      throw error;
    }
  }

  /**
   * Récupère la culture active d'une parcelle avec cache
   */
  async getActiveCropByPlotId(
    plotId: string,
    options: CropServiceOptions = {}
  ): Promise<Crop | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🌾 [CropsService] Récupération de la culture active pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedCrop = await this.cache.getActiveCrop(plotId);
      if (cachedCrop) {
        console.log(`⚡ [CropsService] Cache HIT pour la culture active de la parcelle ${plotId}`);
        return cachedCrop;
      }
      console.log(`❌ [CropsService] Cache MISS pour la culture active de la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la même approche que collecte.ts : requête simple sans jointures
      const { data, error } = await this.supabase
        .from('crops')
        .select('*')
        .eq('plot_id', plotId)
        .in('status', ['en_cours', 'active']) // Statuts considérés comme actifs
        .order('sowing_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [CropsService] Erreur lors de la récupération de la culture active:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [CropsService] Culture active récupérée en ${responseTime}ms`);

      const crop = data ? this.formatCropDataSimple(data) : null;

      // Mettre en cache si activé
      if (useCache && crop) {
        await this.cache.setActiveCrop(plotId, crop, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return crop;
    } catch (error) {
      console.error('❌ [CropsService] Erreur lors de la récupération de la culture active:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle culture et invalide le cache
   */
  async createCrop(
    cropData: CropCreateData,
    agentId?: string,
    options: CropServiceOptions = {}
  ): Promise<Crop> {
    console.log('🌾 [CropsService] Création d\'une nouvelle culture:', cropData.crop_type);

    try {
      const { data, error } = await this.supabase
        .from('crops')
        .insert([{
          plot_id: cropData.plot_id,
          season_id: cropData.season_id,
          crop_type: cropData.crop_type,
          variety: cropData.variety,
          sowing_date: cropData.sowing_date,
          expected_harvest_date: cropData.expected_harvest,
          estimated_yield_kg_ha: cropData.estimated_yield_kg_ha,
          status: cropData.status,
          created_by: cropData.created_by
        }])
        .select(`
          *,
          plots!crops_plot_id_fkey (
            id,
            name,
            producers!plots_producer_id_fkey (
              id,
              name,
              cooperatives!producers_cooperative_id_fkey (
                id,
                name
              )
            )
          ),
          seasons!crops_season_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [CropsService] Erreur lors de la création de la culture:', error);
        throw error;
      }

      const crop = this.formatCropData(data);

      // Invalider le cache
      await this.cache.invalidatePlotCrops(cropData.plot_id);

      console.log(`✅ [CropsService] Culture créée avec succès: ${crop.crop_type} - ${crop.variety}`);
      return crop;
    } catch (error) {
      console.error('❌ [CropsService] Erreur lors de la création de la culture:', error);
      throw error;
    }
  }

  /**
   * Met à jour une culture et invalide le cache
   */
  async updateCrop(
    cropId: string,
    updateData: CropUpdateData,
    agentId?: string,
    options: CropServiceOptions = {}
  ): Promise<Crop> {
    console.log('🌾 [CropsService] Mise à jour de la culture:', cropId);

    try {
      const { data, error } = await this.supabase
        .from('crops')
        .update(updateData)
        .eq('id', cropId)
        .select(`
          *,
          plots!crops_plot_id_fkey (
            id,
            name,
            producers!plots_producer_id_fkey (
              id,
              name,
              cooperatives!producers_cooperative_id_fkey (
                id,
                name
              )
            )
          ),
          seasons!crops_season_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [CropsService] Erreur lors de la mise à jour de la culture:', error);
        throw error;
      }

      const crop = this.formatCropData(data);

      // Invalider le cache
      await this.cache.invalidatePlotCrops(crop.plot_id);
      await this.cache.invalidateCrop(cropId);

      console.log(`✅ [CropsService] Culture mise à jour avec succès: ${crop.crop_type} - ${crop.variety}`);
      return crop;
    } catch (error) {
      console.error('❌ [CropsService] Erreur lors de la mise à jour de la culture:', error);
      throw error;
    }
  }

  /**
   * Supprime une culture et invalide le cache
   */
  async deleteCrop(
    cropId: string,
    agentId: string,
    options: CropServiceOptions = {}
  ): Promise<boolean> {
    console.log('🌾 [CropsService] Suppression de la culture:', cropId);

    try {
      // Récupérer la culture avant suppression pour obtenir le plot_id
      const { data: crop, error: fetchError } = await this.supabase
        .from('crops')
        .select('plot_id')
        .eq('id', cropId)
        .single();

      if (fetchError) {
        console.error('❌ [CropsService] Erreur lors de la récupération de la culture:', fetchError);
        throw fetchError;
      }

      const { error } = await this.supabase
        .from('crops')
        .delete()
        .eq('id', cropId);

      if (error) {
        console.error('❌ [CropsService] Erreur lors de la suppression de la culture:', error);
        throw error;
      }

      // Invalider le cache
      if (crop) {
        await this.cache.invalidatePlotCrops(crop.plot_id);
      }
      await this.cache.invalidateCrop(cropId);

      console.log(`✅ [CropsService] Culture supprimée avec succès: ${cropId}`);
      return true;
    } catch (error) {
      console.error('❌ [CropsService] Erreur lors de la suppression de la culture:', error);
      throw error;
    }
  }

  /**
   * Applique les filtres et le tri aux cultures
   */
  private applyFiltersAndSort(
    crops: Crop[], 
    filters?: CropFilters, 
    sort?: CropSort
  ): Crop[] {
    let filteredCrops = [...crops];

    // Appliquer les filtres
    if (filters) {
      if (filters.plot_id) {
        filteredCrops = filteredCrops.filter(crop => crop.plot_id === filters.plot_id);
      }

      if (filters.season_id) {
        filteredCrops = filteredCrops.filter(crop => crop.season_id === filters.season_id);
      }

      if (filters.crop_type) {
        filteredCrops = filteredCrops.filter(crop => crop.crop_type === filters.crop_type);
      }

      if (filters.status) {
        filteredCrops = filteredCrops.filter(crop => crop.status === filters.status);
      }

      if (filters.variety) {
        filteredCrops = filteredCrops.filter(crop => crop.variety === filters.variety);
      }
    }

    // Appliquer le tri
    if (sort) {
      filteredCrops.sort((a, b) => {
        const aValue = a[sort.field as keyof Crop];
        const bValue = b[sort.field as keyof Crop];
        
        if (sort.direction === 'asc') {
          return (aValue || '') > (bValue || '') ? 1 : -1;
        } else {
          return (aValue || '') < (bValue || '') ? 1 : -1;
        }
      });
    }

    return filteredCrops;
  }

  /**
   * Formate les données d'une culture
   */
  private formatCropData(data: any): Crop {
    return {
      id: data.id,
      plot_id: data.plot_id,
      season_id: data.season_id,
      crop_type: data.crop_type,
      variety: data.variety,
      sowing_date: data.sowing_date,
      expected_harvest_date: data.expected_harvest_date,
      actual_harvest_date: data.actual_harvest_date,
      expected_yield_kg: data.expected_yield_kg,
      actual_yield_kg: data.actual_yield_kg,
      area_hectares: data.area_hectares,
      notes: data.notes,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by
    };
  }

  /**
   * Formate les données d'une culture (version simple sans jointures)
   */
  private formatCropDataSimple(data: any): Crop {
    return {
      id: data.id,
      plot_id: data.plot_id,
      season_id: data.season_id,
      crop_type: data.crop_type,
      variety: data.variety,
      sowing_date: data.sowing_date,
      expected_harvest_date: data.expected_harvest_date,
      actual_harvest_date: data.actual_harvest_date,
      expected_yield_kg: data.expected_yield_kg,
      actual_yield_kg: data.actual_yield_kg,
      area_hectares: data.area_hectares,
      notes: data.notes,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by
    };
  }

  /**
   * Invalide le cache des cultures d'une parcelle
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    await this.cache.invalidatePlotCrops(plotId);
  }

  /**
   * Invalide le cache d'une culture spécifique
   */
  async invalidateCropCache(cropId: string): Promise<void> {
    await this.cache.invalidateCrop(cropId);
  }

  /**
   * Invalide tout le cache des cultures
   */
  async invalidateAllCache(): Promise<void> {
    await this.cache.invalidateAll();
  }
}

export const CropsServiceInstance = new CropsService();
