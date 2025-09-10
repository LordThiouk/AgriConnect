/**
 * Service de collecte de données terrain - AgriConnect
 * Gère les fiches d'exploitation, producteurs et parcelles pour les agents
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';
import { Database } from '../../../types/database';
import { 
  FarmFile, 
  FarmFileDisplay, 
  ProducerDisplay, 
  PlotDisplay,
  CollecteFilters,
  CollecteSort,
  calculateCompletionStatus,
  calculateCompletionPercent,
  getSyncStatus,
  formatLocation,
  formatProducerName
} from '../../types/collecte';

export class CollecteService {
  static supabase: SupabaseClient<Database> = supabase;

  /**
   * Récupère toutes les fiches d'exploitation pour un agent via RPC
   */
  static async getFarmFiles(agentId: string, filters?: CollecteFilters, sort?: CollecteSort): Promise<FarmFileDisplay[]> {
    try {
      console.log('📋 Récupération des fiches d\'exploitation via RPC pour l\'agent:', agentId);

      // Appel de la fonction RPC
      const { data, error } = await this.supabase
        .rpc('get_farm_files', { p_agent_id: agentId });

      if (error) {
        console.error('❌ Erreur lors de la récupération des fiches via RPC:', error);
        throw error;
      }

      console.log('✅ Données RPC récupérées:', data?.length || 0);

      // Transformation des données RPC pour l'affichage
      const farmFilesDisplay: FarmFileDisplay[] = (data || []).map(farmFile => {
        // Créer l'objet producer à partir des données RPC
        const producer = farmFile.producer_first_name ? {
          first_name: farmFile.producer_first_name,
          last_name: farmFile.producer_last_name,
          phone: farmFile.producer_phone,
          commune: farmFile.producer_commune,
          department: farmFile.producer_department,
          region: farmFile.producer_region
        } : null;

        // Créer l'objet cooperative à partir des données RPC
        const cooperative = farmFile.cooperative_name ? {
          name: farmFile.cooperative_name
        } : null;

        // Calculer le statut de complétion
        const completionStatus = farmFile.completion_percent === 100 ? 'completed' : 
                                farmFile.completion_percent > 0 ? 'in_progress' : 'not_started';
        
        const syncStatus = getSyncStatus(farmFile.updated_at, true); // TODO: Vérifier le statut réseau

        return {
          id: farmFile.id,
          name: farmFile.name,
          producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
          location: formatLocation(farmFile.producer_commune, farmFile.producer_department, farmFile.producer_region),
          plotsCount: farmFile.plots_count,
          completionStatus,
          completionPercent: farmFile.completion_percent,
          syncStatus,
          lastUpdated: farmFile.updated_at,
          createdBy: farmFile.created_by,
          cooperativeId: farmFile.cooperative_id,
          // Ajouter les données complètes pour l'affichage
          producer: producer,
          plots: [], // Les parcelles ne sont pas récupérées par la RPC, on peut les récupérer séparément si nécessaire
          // Données supplémentaires de la RPC
          totalAreaHectares: farmFile.total_area_hectares,
          soilTypes: farmFile.soil_types || [],
          waterSources: farmFile.water_sources || [],
          cooperative: cooperative
        };
      });

      // Application des filtres côté client (si nécessaire)
      let filteredFiles = farmFilesDisplay;
      
      if (filters?.status && filters.status.length > 0) {
        filteredFiles = filteredFiles.filter(file => filters.status!.includes(file.completionStatus));
      }

      if (filters?.cooperative) {
        filteredFiles = filteredFiles.filter(file => file.cooperativeId === filters.cooperative);
      }

      if (filters?.search) {
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          file.producerName.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      // Application du tri côté client
      if (sort) {
        filteredFiles.sort((a, b) => {
          let aValue, bValue;
          
          switch (sort.field) {
            case 'lastUpdated':
              aValue = new Date(a.lastUpdated).getTime();
              bValue = new Date(b.lastUpdated).getTime();
              break;
            case 'completionPercent':
              aValue = a.completionPercent;
              bValue = b.completionPercent;
              break;
            case 'plotsCount':
              aValue = a.plotsCount;
              bValue = b.plotsCount;
              break;
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            default:
              aValue = new Date(a.lastUpdated).getTime();
              bValue = new Date(b.lastUpdated).getTime();
          }

          if (sort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      console.log('✅ Fiches d\'exploitation récupérées via RPC:', filteredFiles.length);
      return filteredFiles;

    } catch (error) {
      console.error('❌ Erreur générale dans getFarmFiles:', error);
      throw error;
    }
  }

  /**
   * Récupère une fiche d'exploitation par ID
   */
  static async getFarmFileById(farmFileId: string): Promise<FarmFileDisplay | null> {
    try {
      console.log('📋 Récupération de la fiche d\'exploitation:', farmFileId);

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
        console.error('❌ Erreur lors de la récupération de la fiche:', error);
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
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation récupérée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getFarmFileById:', error);
      throw error;
    }
  }

  /**
   * Récupère les producteurs pour un agent
   */
  static async getProducers(agentId: string): Promise<ProducerDisplay[]> {
    try {
      console.log('👥 Récupération des producteurs pour l\'agent:', agentId);

      const { data, error } = await this.supabase
        .from('producers')
        .select(`
          *,
          cooperatives!producers_cooperative_id_fkey (
            name
          ),
          plots (
            id
          )
        `)
        .eq('cooperative_id', (await this.getAgentCooperative(agentId)))
        .order('last_name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des producteurs:', error);
        throw error;
      }

      const producersDisplay: ProducerDisplay[] = (data || []).map(producer => ({
        id: producer.id,
        name: formatProducerName(producer.first_name, producer.last_name),
        phone: producer.phone,
        location: formatLocation(producer.commune || '', producer.department || '', producer.region || ''),
        cooperativeName: producer.cooperatives?.name || 'Non assigné',
        isActive: producer.is_active || false,
        plotsCount: producer.plots?.length || 0,
        lastVisit: undefined // TODO: Implémenter la logique de dernière visite
      }));

      console.log('✅ Producteurs récupérés:', producersDisplay.length);
      return producersDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getProducers:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles pour un agent
   */
  static async getPlots(agentId: string): Promise<PlotDisplay[]> {
    try {
      console.log('🌾 Récupération des parcelles pour l\'agent:', agentId);

      const cooperativeId = await this.getAgentCooperative(agentId);

      const { data, error } = await this.supabase
        .from('plots')
        .select(`
          *,
          producers!plots_producer_id_fkey (
            first_name,
            last_name
          ),
          crops (
            id,
            crop_type,
            sowing_date
          )
        `)
        .eq('cooperative_id', cooperativeId)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des parcelles:', error);
        throw error;
      }

      const plotsDisplay: PlotDisplay[] = (data || []).map(plot => ({
        id: plot.id,
        name: plot.name,
        area: plot.area_hectares,
        producerName: plot.producers ? formatProducerName(plot.producers.first_name, plot.producers.last_name) : 'Non assigné',
        soilType: plot.soil_type || undefined,
        waterSource: plot.water_source || undefined,
        status: (plot.status as 'preparation' | 'cultivated' | 'fallow') || 'preparation',
        cropsCount: plot.crops?.length || 0,
        lastOperation: plot.crops?.[0]?.sowing_date || undefined,
        hasGps: !!plot.center_point
      }));

      console.log('✅ Parcelles récupérées:', plotsDisplay.length);
      return plotsDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getPlots:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle fiche d'exploitation
   */
  static async createFarmFile(farmFileData: FarmFile): Promise<FarmFileDisplay> {
    try {
      console.log('📝 Création d\'une nouvelle fiche d\'exploitation:', farmFileData);

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
        console.error('❌ Erreur lors de la création de la fiche:', error);
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
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation créée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans createFarmFile:', error);
      throw error;
    }
  }

  /**
   * Met à jour une fiche d'exploitation
   */
  static async updateFarmFile(farmFileId: string, updates: Partial<FarmFile>): Promise<FarmFileDisplay> {
    try {
      console.log('📝 Mise à jour de la fiche d\'exploitation:', farmFileId, updates);

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
        console.error('❌ Erreur lors de la mise à jour de la fiche:', error);
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
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation mise à jour:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans updateFarmFile:', error);
      throw error;
    }
  }

  /**
   * Supprime une fiche d'exploitation
   */
  static async deleteFarmFile(farmFileId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression de la fiche d\'exploitation:', farmFileId);

      const { error } = await this.supabase
        .from('farm_files')
        .delete()
        .eq('id', farmFileId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la fiche:', error);
        throw error;
      }

      console.log('✅ Fiche d\'exploitation supprimée');
      return true;

    } catch (error) {
      console.error('❌ Erreur générale dans deleteFarmFile:', error);
      throw error;
    }
  }

  /**
   * Récupère l'ID de la coopérative d'un agent
   */
  private static async getAgentCooperative(agentId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('cooperative')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération de la coopérative:', error);
        throw error;
      }

      return data.cooperative || '';
    } catch (error) {
      console.error('❌ Erreur générale dans getAgentCooperative:', error);
      throw error;
    }
  }

  /**
   * Vérifie le statut de synchronisation
   */
  static async checkSyncStatus(): Promise<boolean> {
    try {
      // Test simple de connexion
      const { error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut de sync:', error);
      return false;
    }
  }
}
