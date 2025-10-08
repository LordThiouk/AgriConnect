/**
 * Service de gestion des fiches d'exploitation - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { Database } from '../../../../../types/database';
import { FarmFilesCache } from './farmfiles.cache';
import { 
  FarmFile, 
  FarmFileDisplay, 
  FarmFileFilters, 
  FarmFileSort, 
  FarmFileServiceOptions,
  FarmFileStats,
  
} from './farmfiles.types';
import { 
  calculateCompletionStatus,
  calculateCompletionPercent,
  getSyncStatus,
  formatLocation,
  formatProducerName
} from '../../../../types/collecte';

class FarmFilesService {
  private supabase: SupabaseClient<Database> = supabase;
  private cache = new FarmFilesCache();

  /**
   * Récupère toutes les fiches d'exploitation pour un agent via RPC
   */
  async getFarmFiles(
    agentId: string, 
    filters?: FarmFileFilters, 
    sort?: FarmFileSort,
    options: FarmFileServiceOptions = {}
  ): Promise<FarmFileDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📋 [FarmFilesService] Récupération des fiches d\'exploitation pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedFarmFiles = await this.cache.getAgentFarmFiles(agentId);
      if (cachedFarmFiles) {
        console.log(`⚡ [FarmFilesService] Cache HIT: ${cachedFarmFiles.length} fiches pour l'agent ${agentId}`);
        return this.applyFiltersAndSort(cachedFarmFiles, filters, sort);
      }
      console.log(`❌ [FarmFilesService] Cache MISS pour l'agent ${agentId}`);
    }

    try {
      const startTime = Date.now();

      // Appel de la fonction RPC
      const { data, error } = await (this.supabase as any)
        .rpc('get_farm_files', { p_agent_user_id: agentId });

      if (error) {
        console.error('❌ [FarmFilesService] Erreur lors de la récupération des fiches via RPC:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [FarmFilesService] Données RPC récupérées en ${responseTime}ms:`, data?.length || 0);
      
      // Transformer les données RPC en format FarmFileDisplay
      const farmFilesDisplay: FarmFileDisplay[] = (data || []).map((rpcRow: any) => {
        return {
          id: rpcRow.id,
          name: rpcRow.farm_file_name,
          producerName: rpcRow.producer_name,
          location: rpcRow.location,
          plotsCount: rpcRow.plot_count,
          completionPercent: rpcRow.completion_percent,
          status: rpcRow.status,
          completionStatus: rpcRow.completion_percent === 100 ? 'completed' : 
                            rpcRow.completion_percent > 0 ? 'in_progress' : 'draft',
          syncStatus: 'synced',
          lastUpdated: new Date().toISOString(),
        };
      });

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setAgentFarmFiles(agentId, farmFilesDisplay, cacheTTL);
      }

      // Appliquer filtres et tri
      return this.applyFiltersAndSort(farmFilesDisplay, filters, sort);

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans getFarmFiles:', error);
      throw error;
    }
  }

  /**
   * Récupère une fiche d'exploitation par ID
   */
  async getFarmFileById(
    farmFileId: string,
    options: FarmFileServiceOptions = {}
  ): Promise<FarmFileDisplay | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📋 [FarmFilesService] Récupération de la fiche d\'exploitation:', farmFileId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedFarmFile = await this.cache.getFarmFileById(farmFileId);
      if (cachedFarmFile) {
        console.log(`⚡ [FarmFilesService] Cache HIT pour la fiche ${farmFileId}`);
        return cachedFarmFile;
      }
      console.log(`❌ [FarmFilesService] Cache MISS pour la fiche ${farmFileId}`);
    }

    try {
      const { data, error } = await this.supabase
        .from('farm_files')
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name,
            phone,
            commune,
            department,
            region
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          ),
          plots (
            id,
            name,
            area_hectares
          )
        `)
        .eq('id', farmFileId)
        .single();

      if (error) {
        console.error('❌ [FarmFilesService] Erreur lors de la récupération de la fiche:', error);
        throw error;
      }

      if (!data) return null;

      const producer = data.producers;
      const plots = data.plots || [];

      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: plots.length,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setFarmFileById(farmFileId, farmFileDisplay, cacheTTL);
      }

      console.log('✅ [FarmFilesService] Fiche d\'exploitation récupérée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans getFarmFileById:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles d'une fiche
   */
  async getFarmFilePlots(farmFileId: string): Promise<any[]> {
    try {
      console.log('🌾 [FarmFilesService] Récupération des parcelles de la fiche:', farmFileId);
      
      const { data, error } = await this.supabase
        .from('plots')
        .select(`id, name_season_snapshot, area_hectares, cotton_variety`)
        .eq('farm_file_id', farmFileId)
        .order('name_season_snapshot', { ascending: true });

      if (error) {
        console.error('❌ [FarmFilesService] Erreur récupération parcelles fiche:', error);
        throw error;
      }
      
      console.log('✅ [FarmFilesService] Parcelles récupérées:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans getFarmFilePlots:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle fiche d'exploitation
   */
  async createFarmFile(farmFileData: FarmFile): Promise<FarmFileDisplay> {
    try {
      console.log('📝 [FarmFilesService] Création d\'une nouvelle fiche d\'exploitation:', farmFileData);

      const { data, error } = await this.supabase
        .from('farm_files')
        .insert(farmFileData)
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [FarmFilesService] Erreur lors de la création de la fiche:', error);
        throw error;
      }

      const producer = data.producers;
      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: 0,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      // Invalider le cache
      await this.cache.invalidateFarmFile(data.id);

      console.log('✅ [FarmFilesService] Fiche d\'exploitation créée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans createFarmFile:', error);
      throw error;
    }
  }

  /**
   * Met à jour une fiche d'exploitation
   */
  async updateFarmFile(farmFileId: string, updates: Partial<FarmFile>): Promise<FarmFileDisplay> {
    try {
      console.log('📝 [FarmFilesService] Mise à jour de la fiche d\'exploitation:', farmFileId, updates);

      const { data, error } = await this.supabase
        .from('farm_files')
        .update(updates)
        .eq('id', farmFileId)
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          ),
          plots (
            id
          )
        `)
        .single();

      if (error) {
        console.error('❌ [FarmFilesService] Erreur lors de la mise à jour de la fiche:', error);
        throw error;
      }

      const producer = data.producers;
      const plots = data.plots || [];
      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: plots.length,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      // Invalider le cache
      await this.cache.invalidateFarmFile(farmFileId);

      console.log('✅ [FarmFilesService] Fiche d\'exploitation mise à jour:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans updateFarmFile:', error);
      throw error;
    }
  }

  /**
   * Supprime une fiche d'exploitation
   */
  async deleteFarmFile(farmFileId: string): Promise<boolean> {
    try {
      console.log('🗑️ [FarmFilesService] Suppression de la fiche d\'exploitation:', farmFileId);

      const { error } = await this.supabase
        .from('farm_files')
        .delete()
        .eq('id', farmFileId);

      if (error) {
        console.error('❌ [FarmFilesService] Erreur lors de la suppression de la fiche:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateFarmFile(farmFileId);

      console.log('✅ [FarmFilesService] Fiche d\'exploitation supprimée');
      return true;

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans deleteFarmFile:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des fiches d'un agent
   */
  async getAgentFarmFileStats(
    agentId: string,
    options: FarmFileServiceOptions = {}
  ): Promise<FarmFileStats> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📊 [FarmFilesService] Récupération des statistiques pour l\'agent:', agentId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedStats = await this.cache.getAgentFarmFileStats(agentId);
      if (cachedStats) {
        console.log(`⚡ [FarmFilesService] Cache HIT pour les stats de l'agent ${agentId}`);
        return cachedStats;
      }
      console.log(`❌ [FarmFilesService] Cache MISS pour les stats de l'agent ${agentId}`);
    }

    try {
      // Récupérer les fiches pour calculer les stats
      const farmFiles = await this.getFarmFiles(agentId, undefined, undefined, { useCache: false });

      const stats: FarmFileStats = {
        total: farmFiles.length,
        completed: farmFiles.filter(f => f.completionStatus === 'completed').length,
        in_progress: farmFiles.filter(f => f.completionStatus === 'in_progress').length,
        draft: farmFiles.filter(f => f.completionStatus === 'draft').length,
        average_completion: farmFiles.length > 0 
          ? farmFiles.reduce((sum, f) => sum + f.completionPercent, 0) / farmFiles.length 
          : 0
      };

      // Mettre en cache si activé
      if (useCache) {
        await this.cache.setAgentFarmFileStats(agentId, stats, cacheTTL);
      }

      console.log('✅ [FarmFilesService] Statistiques calculées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ [FarmFilesService] Erreur générale dans getAgentFarmFileStats:', error);
      throw error;
    }
  }

  /**
   * Applique les filtres et le tri aux fiches
   */
  private applyFiltersAndSort(
    farmFiles: FarmFileDisplay[], 
    filters?: FarmFileFilters, 
    sort?: FarmFileSort
  ): FarmFileDisplay[] {
    let filteredFiles = farmFiles;
    
    if (filters?.status && filters.status.length > 0) {
      filteredFiles = filteredFiles.filter(file => filters.status!.includes(file.completionStatus));
    }

    if (filters?.search) {
      filteredFiles = filteredFiles.filter(file => 
        file.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        file.producerName.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters?.cooperative) {
      filteredFiles = filteredFiles.filter(file => 
        file.cooperativeId === filters.cooperative
      );
    }

    if (filters?.region) {
      filteredFiles = filteredFiles.filter(file => 
        file.location.toLowerCase().includes(filters.region!.toLowerCase())
      );
    }

    if (sort) {
      filteredFiles.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort.field) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'completionPercent':
            aValue = a.completionPercent;
            bValue = b.completionPercent;
            break;
          case 'lastUpdated':
            aValue = new Date(a.lastUpdated).getTime();
            bValue = new Date(b.lastUpdated).getTime();
            break;
          default:
            return 0;
        }

        if (sort.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filteredFiles;
  }
}

export const FarmFilesServiceInstance = new FarmFilesService();